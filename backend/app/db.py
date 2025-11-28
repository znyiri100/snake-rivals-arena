from typing import Dict, List, Optional
from .models import User, LeaderboardEntry, GameSession, GameMode
from datetime import datetime

class MockDB:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.user_passwords: Dict[str, str] = {}  # Store passwords separately
        self.leaderboard: List[LeaderboardEntry] = []
        self.sessions: List[GameSession] = []
        
        # Initialize with some mock data
        self._seed_data()

    def _seed_data(self):
        # Mock users
        self.create_user("1", "SnakeMaster", "master@example.com", "password123")
        self.create_user("2", "NeonKing", "king@example.com", "password123")
        
        # Mock leaderboard
        self.leaderboard.append(LeaderboardEntry(
            id="1", username="SnakeMaster", score=2850, gameMode=GameMode.walls, timestamp=datetime.now()
        ))
        self.leaderboard.append(LeaderboardEntry(
            id="2", username="NeonKing", score=2340, gameMode=GameMode.passthrough, timestamp=datetime.now()
        ))
        
        # Mock sessions
        self.sessions.append(GameSession(
            id="1", userId="1", username="SnakeMaster", score=850, gameMode=GameMode.walls, isActive=True
        ))

    def create_user(self, id: str, username: str, email: str, password: str) -> User:
        user = User(id=id, username=username, email=email)
        self.users[email] = user
        self.user_passwords[email] = password
        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.users.get(email)

    def verify_password(self, email: str, password: str) -> bool:
        return self.user_passwords.get(email) == password

    def add_score(self, entry: LeaderboardEntry):
        self.leaderboard.append(entry)
        self.leaderboard.sort(key=lambda x: x.score, reverse=True)

    def get_leaderboard(self, game_mode: Optional[GameMode] = None) -> List[LeaderboardEntry]:
        if game_mode:
            return [entry for entry in self.leaderboard if entry.gameMode == game_mode]
        return self.leaderboard

    def get_active_sessions(self) -> List[GameSession]:
        return [s for s in self.sessions if s.isActive]

    def get_session(self, id: str) -> Optional[GameSession]:
        for session in self.sessions:
            if session.id == id:
                return session
        return None

db = MockDB()
