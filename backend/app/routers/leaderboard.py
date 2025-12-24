from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
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
    # 1. Base query for LeaderboardEntry with eager loading of user and their groups
    query = (
        select(DBLeaderboardEntry)
        .options(
            selectinload(DBLeaderboardEntry.user).selectinload(DBUser.groups)
        )
        .order_by(DBLeaderboardEntry.score.desc())
    )
    
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)
        
    # 2. Handle Group Filtering
    if group_id and group_id != "all":
        # Join User and Groups to filter
        query = (
            query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
    elif not group_id:
        # Default group logic: Filter by the current user's first group if applicable
        current_user = None
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1]
            try:
                current_user = await get_current_user(token, db)
            except HTTPException:
                current_user = None

        if current_user and getattr(current_user, "groups", None):
            default_gid = current_user.groups[0].id
            query = (
                query
                .join(DBLeaderboardEntry.user)
                .join(DBUser.groups)
                .where(DBGroup.id == default_gid)
            )

    # Execute main query
    result = await db.execute(query)
    entries = result.scalars().all()

    # 3. Build Response
    out = []
    for e in entries:
        # Gracefully handle missing user relation if data integrity was previously compromised
        user_groups = []
        if e.user and e.user.groups:
            user_groups = [{"id": g.id, "name": g.name} for g in e.user.groups]
            
        out.append({
            "id": e.id,
            "username": e.username,
            "score": e.score,
            "gameMode": e.game_mode,
            "timestamp": e.timestamp,
            "groups": user_groups
        })

    return out

@router.post("")
async def submit_score(submission: ScoreSubmission, current_user: DBUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    entry = DBLeaderboardEntry(
        username=current_user.username,
        user_id=current_user.id, # Populate the new FK
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
    username: Optional[str] = None,
    sort_by: str = "rank",  # "rank" (default) or "date"
    db: AsyncSession = Depends(get_db)
):
    """Get all individual scores ranked by score descending"""
    from sqlalchemy import func
    
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
        ).label('rank'),
        DBLeaderboardEntry.user_id # Fetch user_id to help with eager loading later if needed
    )
    
    # Sorting logic
    if sort_by == "date":
        query = query.order_by(DBLeaderboardEntry.timestamp.desc())
    else:
        # Default to rank/score
        query = query.order_by(DBLeaderboardEntry.score.desc())
    
    
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)

    if username:
        query = query.where(DBLeaderboardEntry.username == username)
    
    # Group filtering using Joins
    if group_id and group_id != "all":
        query = (
            query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
    
    result = await db.execute(query)
    entries = result.all()
    
    # Fetch user groups efficiently
    # Since we select specific columns, we don't have the ORM objects with relationships loaded.
    # We'll gather user IDs and fetch their groups.
    user_ids = list({e.user_id for e in entries if e.user_id})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if user_ids:
        user_query = (
            select(DBUser)
            .where(DBUser.id.in_(user_ids))
            .options(selectinload(DBUser.groups))
        )
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        for u in users:
            # Map by username as the response format expects it, but we joined by ID
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
    
    # Use window functions to get best score + timestamp + count per user/mode
    # Inner query to calculate rank/row_number per user
    inner_query = select(
        DBLeaderboardEntry.username,
        DBLeaderboardEntry.user_id,
        DBLeaderboardEntry.game_mode,
        DBLeaderboardEntry.score,
        DBLeaderboardEntry.timestamp,
        func.count().over(partition_by=[DBLeaderboardEntry.username, DBLeaderboardEntry.game_mode]).label('games_played'),
        func.row_number().over(
            partition_by=[DBLeaderboardEntry.username, DBLeaderboardEntry.game_mode],
            order_by=DBLeaderboardEntry.score.desc()
        ).label('rn')
    )
    
    if gameMode:
        inner_query = inner_query.where(DBLeaderboardEntry.game_mode == gameMode)

    # Group filtering via Joins
    if group_id and group_id != "all":
        inner_query = (
            inner_query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        
    subq = inner_query.subquery()
    
    # Filter for best score (rn=1)
    best_scores_subq = select(
        subq.c.username,
        subq.c.user_id,
        subq.c.game_mode,
        subq.c.score.label('best_score'),
        subq.c.timestamp,
        subq.c.games_played
    ).where(subq.c.rn == 1).subquery()
    
    # Main query with global ranking per mode
    query = select(
        best_scores_subq.c.username,
        best_scores_subq.c.user_id,
        best_scores_subq.c.game_mode,
        best_scores_subq.c.best_score,
        best_scores_subq.c.timestamp,
        best_scores_subq.c.games_played,
        func.rank().over(
            partition_by=best_scores_subq.c.game_mode,
            order_by=best_scores_subq.c.best_score.desc()
        ).label('rank')
    ).order_by(best_scores_subq.c.game_mode, best_scores_subq.c.best_score.desc())
    
    result = await db.execute(query)
    entries = result.all()
    
    # Fetch user groups
    user_ids = list({e.user_id for e in entries if e.user_id})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if user_ids:
        user_query = select(DBUser).where(DBUser.id.in_(user_ids)).options(selectinload(DBUser.groups))
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        for u in users:
            users_map[u.username] = [{"id": g.id, "name": g.name} for g in u.groups]
    
    return [
        {
            "username": e.username,
            "game_mode": e.game_mode,
            "best_score": e.best_score,
            "timestamp": e.timestamp,
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
    
    # Get best scores per user per mode
    best_scores_subq = (
        select(
            DBLeaderboardEntry.username,
            DBLeaderboardEntry.user_id,
            DBLeaderboardEntry.game_mode,
            func.max(DBLeaderboardEntry.score).label('best_score')
        )
        .group_by(DBLeaderboardEntry.username, DBLeaderboardEntry.user_id, DBLeaderboardEntry.game_mode)
    )
    
    # Group filtering
    if group_id and group_id != "all":
        best_scores_subq = (
            best_scores_subq
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
    
    best_scores_subq = best_scores_subq.subquery()
    
    # Query with ranking and limit per partition
    query = select(
        best_scores_subq.c.username,
        best_scores_subq.c.user_id,
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
    top_entries = []
    for e in all_entries:
        if e.rank <= limit:
            if e.game_mode not in entries_by_mode:
                entries_by_mode[e.game_mode] = []
            entries_by_mode[e.game_mode].append(e)
            top_entries.append(e)
    
    # Fetch user groups
    user_ids = list({e.user_id for e in top_entries if e.user_id})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if user_ids:
        user_query = select(DBUser).where(DBUser.id.in_(user_ids)).options(selectinload(DBUser.groups))
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
    
    # Get best scores per user per mode
    best_scores_subq = (
        select(
            DBLeaderboardEntry.username,
            DBLeaderboardEntry.user_id,
            DBLeaderboardEntry.game_mode,
            func.max(DBLeaderboardEntry.score).label('best_score')
        )
        .group_by(DBLeaderboardEntry.username, DBLeaderboardEntry.user_id, DBLeaderboardEntry.game_mode)
    )
    
    # Group filtering
    if group_id and group_id != "all":
        best_scores_subq = (
            best_scores_subq
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
    
    best_scores_subq = best_scores_subq.subquery()
    
    # Add ranks per game mode
    ranked_subq = select(
        best_scores_subq.c.username,
        best_scores_subq.c.user_id,
        best_scores_subq.c.game_mode,
        best_scores_subq.c.best_score,
        func.rank().over(
            partition_by=best_scores_subq.c.game_mode,
            order_by=best_scores_subq.c.best_score.desc()
        ).label('game_rank')
    ).subquery()
    
    # Aggregate by user in Python
    query = select(ranked_subq)
    
    result = await db.execute(query)
    raw_entries = result.all()
    
    # Process in Python
    user_stats = {}
    user_id_map = {} # Map username to user_id for group fetching
    
    for row in raw_entries:
        uname = row.username
        if row.user_id:
            user_id_map[uname] = row.user_id
            
        if uname not in user_stats:
            user_stats[uname] = {
                "username": uname,
                "modes_played": 0,
                "total_best_scores": 0,
                "ranks": [],
                "mode_ranks": {}
            }
        
        stat = user_stats[uname]
        stat["modes_played"] += 1
        stat["total_best_scores"] += row.best_score
        stat["ranks"].append(row.game_rank)
        stat["mode_ranks"][row.game_mode] = row.game_rank
        
    # Calculate averages and format
    final_list = []
    for uname, data in user_stats.items():
        avg = sum(data["ranks"]) / len(data["ranks"])
        final_list.append({
            "username": uname,
            "modes_played": data["modes_played"],
            "total_best_scores": data["total_best_scores"],
            "avg_rank": round(avg, 2),
            "mode_ranks": data["mode_ranks"]
        })
        
    # Sort by avg_rank ascending (lower is better)
    final_list.sort(key=lambda x: x["avg_rank"])
    
    # Fetch user groups
    user_ids = list(user_id_map.values())
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if user_ids:
        user_query = select(DBUser).where(DBUser.id.in_(user_ids)).options(selectinload(DBUser.groups))
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        for u in users:
            users_map[u.username] = [{"id": g.id, "name": g.name} for g in u.groups]
    
    return [
        {
            "username": e["username"],
            "modes_played": e["modes_played"],
            "total_best_scores": e["total_best_scores"],
            "avg_rank": e["avg_rank"],
            "overall_rank": idx + 1,
            "mode_ranks": e["mode_ranks"],
            "groups": users_map.get(e["username"], [])
        }
        for idx, e in enumerate(final_list)
    ]

@router.get("/stats/summary")
async def get_stats_summary(
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get summary statistics for the dashboard"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Base queries
    query_total = select(func.count(DBLeaderboardEntry.id))
    query_users = select(func.count(func.distinct(DBLeaderboardEntry.user_id)))
    
    yesterday = datetime.now() - timedelta(days=1)
    query_recent = select(func.count(DBLeaderboardEntry.id)).where(DBLeaderboardEntry.timestamp >= yesterday)
    
    query_mode = (
        select(DBLeaderboardEntry.game_mode, func.count(DBLeaderboardEntry.id).label('count'))
        .group_by(DBLeaderboardEntry.game_mode)
        .order_by(func.count(DBLeaderboardEntry.id).desc())
        .limit(1)
    )
    
    # Apply group filtering
    if group_id and group_id != "all":
        # Create a common join condition or just apply to each
        # For counts, we can join
        join_clause = (
            select(DBLeaderboardEntry.id)
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        # Using EXISTS or IN for cleaner generated SQL often, but direct join on count works if distinct is careful.
        # Actually simpler: join directly in the select if simple count.
        
        # Rewrite to use standard join approach for filtering
        query_total = (
            select(func.count(DBLeaderboardEntry.id))
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        
        query_users = (
            select(func.count(func.distinct(DBLeaderboardEntry.user_id)))
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        
        query_recent = (
            select(func.count(DBLeaderboardEntry.id))
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
            .where(DBLeaderboardEntry.timestamp >= yesterday)
        )
        
        query_mode = (
            select(DBLeaderboardEntry.game_mode, func.count(DBLeaderboardEntry.id).label('count'))
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
            .group_by(DBLeaderboardEntry.game_mode)
            .order_by(func.count(DBLeaderboardEntry.id).desc())
            .limit(1)
        )

    # Execute
    total_games = (await db.execute(query_total)).scalar() or 0
    total_players = (await db.execute(query_users)).scalar() or 0
    recent_games = (await db.execute(query_recent)).scalar() or 0
    
    mode_res = (await db.execute(query_mode)).first()
    popular_mode = mode_res[0] if mode_res else "None"
    
    return {
        "total_games": total_games,
        "total_players": total_players,
        "recent_games": recent_games,
        "popular_mode": popular_mode
    }

@router.get("/stats/distribution")
async def get_score_distribution(
    gameMode: GameMode,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get score distribution buckets for a specific game mode"""
    
    query = select(DBLeaderboardEntry.score).where(DBLeaderboardEntry.game_mode == gameMode)
    
    if group_id and group_id != "all":
        query = (
            query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        
    result = await db.execute(query)
    scores = result.scalars().all()
    
    if not scores:
        return []
        
    scores = [s for s in scores]
    scores.sort()
    
    # Create 10 buckets
    if not scores:
        return []
        
    min_s = scores[0]
    max_s = scores[-1]
    
    if min_s == max_s:
        return [{"range": f"{min_s}", "count": len(scores)}]
        
    step = (max_s - min_s) / 10
    if step == 0: step = 1
    
    buckets = []
    # Initialize buckets
    current = min_s
    for _ in range(10):
        end = current + step
        # Label format: "0-100", "100-200" etc.
        range_label = f"{int(current)}-{int(end)}"
        count = len([s for s in scores if current <= s < end])
        # Last bucket includes the max incase of float precision issues
        if _ == 9:
            count = len([s for s in scores if current <= s])
            
        buckets.append({"range": range_label, "count": count})
        current = end
        
    return buckets

@router.get("/stats/activity")
async def get_activity_trends(
    days: int = 30,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get daily game activity for the last N days"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Truncate to day
    date_col = func.date_trunc('day', DBLeaderboardEntry.timestamp)
    
    query = (
        select(date_col, func.count(DBLeaderboardEntry.id))
        .where(DBLeaderboardEntry.timestamp >= start_date)
        .group_by(date_col)
        .order_by(date_col)
    )
    
    if group_id and group_id != "all":
        query = (
            query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        
    result = await db.execute(query)
    data = result.all()
    
    # Fill in missing days
    activity = {}
    for date, count in data:
        if date:
            activity[date.strftime('%Y-%m-%d')] = count
            
    final_data = []
    for i in range(days + 1):
        d = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        final_data.append({
            "date": d,
            "games": activity.get(d, 0)
        })
        
    return final_data


@router.get("/stats/activity/by-mode")
async def get_activity_by_mode(
    days: int = 30,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get daily game activity broken down by game mode for the last N days"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    start_date = datetime.now() - timedelta(days=days)
    date_col = func.date_trunc('day', DBLeaderboardEntry.timestamp)
    
    # Query: Date, GameMode, Count
    query = (
        select(
            date_col.label('date'), 
            DBLeaderboardEntry.game_mode, 
            func.count(DBLeaderboardEntry.id).label('count')
        )
        .where(DBLeaderboardEntry.timestamp >= start_date)
        .group_by(date_col, DBLeaderboardEntry.game_mode)
        .order_by(date_col)
    )
    
    if group_id and group_id != "all":
        query = (
            query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        
    result = await db.execute(query)
    rows = result.all()
    
    # Process into [{date: 'YYYY-MM-DD', snake: 5, tetris: 2, ...}, ...]
    data_map = {}
    
    # Initialize all dates with 0s
    for i in range(days + 1):
        d = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        data_map[d] = {"date": d}
        for mode in GameMode:
            data_map[d][mode.value] = 0

    for r in rows:
        if r.date:
            d_str = r.date.strftime('%Y-%m-%d')
            if d_str in data_map:
                data_map[d_str][r.game_mode] = r.count
                
    return sorted(list(data_map.values()), key=lambda x: x['date'])

@router.get("/stats/activity/by-user")
async def get_activity_by_user(
    days: int = 30,
    group_id: Optional[str] = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get daily game activity broken down by user for the last N days (Top N users)"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    start_date = datetime.now() - timedelta(days=days)
    
    # 1. Identify Top N active users in this period
    count_query = (
        select(DBLeaderboardEntry.username, func.count(DBLeaderboardEntry.id).label('total'))
        .where(DBLeaderboardEntry.timestamp >= start_date)
        .group_by(DBLeaderboardEntry.username)
        .order_by(func.count(DBLeaderboardEntry.id).desc())
        .limit(limit)
    )
    
    if group_id and group_id != "all":
        count_query = (
            count_query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
        
    top_users_res = await db.execute(count_query)
    top_users = [row.username for row in top_users_res.all()]
    
    if not top_users:
        return []

    # 2. Get daily data for these users
    date_col = func.date_trunc('day', DBLeaderboardEntry.timestamp)
    
    query = (
        select(
            date_col.label('date'), 
            DBLeaderboardEntry.username, 
            func.count(DBLeaderboardEntry.id).label('count')
        )
        .where(DBLeaderboardEntry.timestamp >= start_date)
        .where(DBLeaderboardEntry.username.in_(top_users))
        .group_by(date_col, DBLeaderboardEntry.username)
        .order_by(date_col)
    )
    
    # Note: For the detailed data, we re-apply group filter if strictly necessary, 
    # but filtering by the Top Users list (who were already filtered by group) acts as a secondary filter.
    # However, to be rigorously correct if a user is in multiple groups, we should filter again.
    if group_id and group_id != "all":
        query = (
            query
            .join(DBLeaderboardEntry.user)
            .join(DBUser.groups)
            .where(DBGroup.id == group_id)
        )
    
    result = await db.execute(query)
    rows = result.all()
    
    # Process
    data_map = {}
    
    # Initialize dates
    for i in range(days + 1):
        d = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        data_map[d] = {"date": d}
        for u in top_users:
            data_map[d][u] = 0
            
    for r in rows:
        if r.date:
            d_str = r.date.strftime('%Y-%m-%d')
            if d_str in data_map:
                data_map[d_str][r.username] = r.count
                
    return sorted(list(data_map.values()), key=lambda x: x['date'])
