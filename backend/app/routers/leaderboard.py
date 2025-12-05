from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import LeaderboardEntry, ScoreSubmission, GameMode, Group as ModelGroup
from ..sql_models import LeaderboardEntry as DBLeaderboardEntry, User as DBUser, Group as DBGroup
from ..db import get_db
from .auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    gameMode: Optional[GameMode] = None, 
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    # 1. Base query for LeaderboardEntry
    query = select(DBLeaderboardEntry).order_by(DBLeaderboardEntry.score.desc())
    
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)
        
    # 2. Handle Group Filtering
    if group_id:
        if group_id != "all":
            # Filter by users in the specific group
            subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
            query = query.where(DBLeaderboardEntry.username.in_(subquery))
    else:
        # Default group logic
        current_user = None
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1]
            try:
                current_user = await get_current_user(token, db)
            except HTTPException:
                current_user = None

        if current_user and getattr(current_user, "groups", None):
            default_gid = current_user.groups[0].id
            subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == default_gid)
            query = query.where(DBLeaderboardEntry.username.in_(subquery))

    # Execute main query
    result = await db.execute(query)
    entries = result.scalars().all()

    # 3. Efficiently fetch Users with Groups (Eager Loading)
    # We need the groups for each user in the leaderboard to display them.
    # Instead of iterating and lazy-loading (which fails in async), we fetch all relevant users with their groups in one go.
    
    usernames = list({e.username for e in entries})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if usernames:
        # Use selectinload to fetch groups eagerly
        from sqlalchemy.orm import selectinload
        user_query = (
            select(DBUser)
            .where(DBUser.username.in_(usernames))
            .options(selectinload(DBUser.groups))
        )
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        
        for u in users:
            g_list = [{"id": g.id, "name": g.name} for g in u.groups]
            users_map[u.username] = g_list

    # 4. Build Response
    out = []
    for e in entries:
        out.append({
            "id": e.id,
            "username": e.username,
            "score": e.score,
            "gameMode": e.game_mode,
            "timestamp": e.timestamp,
            "groups": users_map.get(e.username, [])
        })

    return out

@router.post("")
async def submit_score(submission: ScoreSubmission, current_user: DBUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    entry = DBLeaderboardEntry(
        username=current_user.username,
        score=submission.score,
        game_mode=submission.gameMode,
        timestamp=datetime.now()
    )
    db.add(entry)
    await db.commit()
    return {"message": "Score submitted successfully"}

# New ranking endpoints
@router.get("/rankings/all-scores")
async def get_all_scores_ranked(
    gameMode: Optional[GameMode] = None,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all individual scores ranked by score descending"""
    from sqlalchemy import func
    from sqlalchemy.orm import selectinload
    
    # Base query
    query = select(
        DBLeaderboardEntry.id,
        DBLeaderboardEntry.username,
        DBLeaderboardEntry.score,
        DBLeaderboardEntry.game_mode,
        DBLeaderboardEntry.timestamp,
        func.rank().over(
            partition_by=DBLeaderboardEntry.game_mode if gameMode is None else None,
            order_by=DBLeaderboardEntry.score.desc()
        ).label('rank')
    ).order_by(DBLeaderboardEntry.score.desc())
    
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)
    
    # Group filtering
    if group_id and group_id != "all":
        subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
        query = query.where(DBLeaderboardEntry.username.in_(subquery))
    
    result = await db.execute(query)
    entries = result.all()
    
    # Fetch user groups
    usernames = list({e.username for e in entries})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if usernames:
        user_query = select(DBUser).where(DBUser.username.in_(usernames)).options(selectinload(DBUser.groups))
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        for u in users:
            users_map[u.username] = [{"id": g.id, "name": g.name} for g in u.groups]
    
    return [
        {
            "id": e.id,
            "username": e.username,
            "score": e.score,
            "game_mode": e.game_mode,
            "timestamp": e.timestamp,
            "rank": e.rank,
            "groups": users_map.get(e.username, [])
        }
        for e in entries
    ]

@router.get("/rankings/best-per-user")
async def get_best_per_user_per_mode(
    gameMode: Optional[GameMode] = None,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get best score per user per game mode with rankings"""
    from sqlalchemy import func
    from sqlalchemy.orm import selectinload
    
    # Subquery to get best scores
    best_scores_subq = (
        select(
            DBLeaderboardEntry.username,
            DBLeaderboardEntry.game_mode,
            func.max(DBLeaderboardEntry.score).label('best_score'),
            func.count().label('games_played')
        )
        .group_by(DBLeaderboardEntry.username, DBLeaderboardEntry.game_mode)
    )
    
    if gameMode:
        best_scores_subq = best_scores_subq.where(DBLeaderboardEntry.game_mode == gameMode)
    
    # Group filtering
    if group_id and group_id != "all":
        user_subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
        best_scores_subq = best_scores_subq.where(DBLeaderboardEntry.username.in_(user_subquery))
    
    best_scores_subq = best_scores_subq.subquery()
    
    # Main query with ranking
    query = select(
        best_scores_subq.c.username,
        best_scores_subq.c.game_mode,
        best_scores_subq.c.best_score,
        best_scores_subq.c.games_played,
        func.rank().over(
            partition_by=best_scores_subq.c.game_mode,
            order_by=best_scores_subq.c.best_score.desc()
        ).label('rank')
    ).order_by(best_scores_subq.c.game_mode, best_scores_subq.c.best_score.desc())
    
    result = await db.execute(query)
    entries = result.all()
    
    # Fetch user groups
    usernames = list({e.username for e in entries})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if usernames:
        user_query = select(DBUser).where(DBUser.username.in_(usernames)).options(selectinload(DBUser.groups))
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        for u in users:
            users_map[u.username] = [{"id": g.id, "name": g.name} for g in u.groups]
    
    return [
        {
            "username": e.username,
            "game_mode": e.game_mode,
            "best_score": e.best_score,
            "games_played": e.games_played,
            "rank": e.rank,
            "groups": users_map.get(e.username, [])
        }
        for e in entries
    ]

@router.get("/rankings/top-n")
async def get_top_n_per_mode(
    limit: int = 10,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get top N players for each game mode"""
    from sqlalchemy import func
    from sqlalchemy.orm import selectinload
    
    # Get best scores per user per mode
    best_scores_subq = (
        select(
            DBLeaderboardEntry.username,
            DBLeaderboardEntry.game_mode,
            func.max(DBLeaderboardEntry.score).label('best_score')
        )
        .group_by(DBLeaderboardEntry.username, DBLeaderboardEntry.game_mode)
    )
    
    # Group filtering
    if group_id and group_id != "all":
        user_subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
        best_scores_subq = best_scores_subq.where(DBLeaderboardEntry.username.in_(user_subquery))
    
    best_scores_subq = best_scores_subq.subquery()
    
    # Query with ranking and limit per partition
    query = select(
        best_scores_subq.c.username,
        best_scores_subq.c.game_mode,
        best_scores_subq.c.best_score,
        func.rank().over(
            partition_by=best_scores_subq.c.game_mode,
            order_by=best_scores_subq.c.best_score.desc()
        ).label('rank')
    ).order_by(best_scores_subq.c.game_mode, best_scores_subq.c.best_score.desc())
    
    result = await db.execute(query)
    all_entries = result.all()
    
    # Filter to top N per mode
    entries_by_mode: Dict[str, List] = {}
    for e in all_entries:
        if e.rank <= limit:
            if e.game_mode not in entries_by_mode:
                entries_by_mode[e.game_mode] = []
            entries_by_mode[e.game_mode].append(e)
    
    # Fetch user groups
    usernames = list({e.username for e in all_entries if e.rank <= limit})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if usernames:
        user_query = select(DBUser).where(DBUser.username.in_(usernames)).options(selectinload(DBUser.groups))
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        for u in users:
            users_map[u.username] = [{"id": g.id, "name": g.name} for g in u.groups]
    
    # Format response
    result_dict = {}
    for mode, entries in entries_by_mode.items():
        result_dict[mode] = [
            {
                "username": e.username,
                "best_score": e.best_score,
                "rank": e.rank,
                "groups": users_map.get(e.username, [])
            }
            for e in entries
        ]
    
    return result_dict

@router.get("/rankings/overall")
async def get_overall_rankings(
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get cross-game mode overall rankings based on average rank"""
    from sqlalchemy import func
    from sqlalchemy.orm import selectinload
    
    # Get best scores per user per mode with ranks
    best_scores_subq = (
        select(
            DBLeaderboardEntry.username,
            DBLeaderboardEntry.game_mode,
            func.max(DBLeaderboardEntry.score).label('best_score')
        )
        .group_by(DBLeaderboardEntry.username, DBLeaderboardEntry.game_mode)
    )
    
    # Group filtering
    if group_id and group_id != "all":
        user_subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
        best_scores_subq = best_scores_subq.where(DBLeaderboardEntry.username.in_(user_subquery))
    
    best_scores_subq = best_scores_subq.subquery()
    
    # Add ranks per game mode
    ranked_subq = select(
        best_scores_subq.c.username,
        best_scores_subq.c.game_mode,
        best_scores_subq.c.best_score,
        func.rank().over(
            partition_by=best_scores_subq.c.game_mode,
            order_by=best_scores_subq.c.best_score.desc()
        ).label('game_rank')
    ).subquery()
    
    # Aggregate by user
    query = select(
        ranked_subq.c.username,
        func.count(func.distinct(ranked_subq.c.game_mode)).label('modes_played'),
        func.sum(ranked_subq.c.best_score).label('total_best_scores'),
        func.avg(ranked_subq.c.game_rank).label('avg_rank')
    ).group_by(ranked_subq.c.username).order_by(func.avg(ranked_subq.c.game_rank))
    
    result = await db.execute(query)
    entries = result.all()
    
    # Fetch user groups
    usernames = list({e.username for e in entries})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if usernames:
        user_query = select(DBUser).where(DBUser.username.in_(usernames)).options(selectinload(DBUser.groups))
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        for u in users:
            users_map[u.username] = [{"id": g.id, "name": g.name} for g in u.groups]
    
    return [
        {
            "username": e.username,
            "modes_played": e.modes_played,
            "total_best_scores": e.total_best_scores,
            "avg_rank": round(float(e.avg_rank), 2),
            "overall_rank": idx + 1,
            "groups": users_map.get(e.username, [])
        }
        for idx, e in enumerate(entries)
    ]
