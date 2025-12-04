from app.models import LeaderboardEntry, GameMode
from datetime import datetime

def test_leaderboard_entry_alias():
    """Test that gameMode alias works correctly"""
    entry = LeaderboardEntry(
        id="123",
        username="testuser",
        score=100,
        gameMode="snake",
        timestamp=datetime.now()
    )
    assert entry.game_mode == GameMode.snake
    # Check serialization uses alias
    dump = entry.model_dump(by_alias=True)
    assert "gameMode" in dump
    assert dump["gameMode"] == "snake"

def test_gamemode_enum():
    """Test GameMode enum values"""
    assert GameMode.snake == "snake"
