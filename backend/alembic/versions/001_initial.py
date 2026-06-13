"""Initial schema: users, refresh_tokens, favorites

Revision ID: 001_initial
Revises:
Create Date: 2026-06-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    id_type = sa.CHAR(32) if is_sqlite else postgresql.UUID(as_uuid=True)
    json_type = sa.JSON if is_sqlite else postgresql.JSONB()
    now_default = sa.text("(CURRENT_TIMESTAMP)") if is_sqlite else sa.text("now()")

    # ── users ──────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", id_type, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=now_default,
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ── refresh_tokens ─────────────────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", id_type, primary_key=True),
        sa.Column(
            "user_id",
            id_type,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=now_default,
            nullable=False,
        ),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])

    # ── favorites ──────────────────────────────────────────────────────
    op.create_table(
        "favorites",
        sa.Column("id", id_type, primary_key=True),
        sa.Column(
            "user_id",
            id_type,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("item_type", sa.String(50), nullable=False),
        sa.Column("item_payload", json_type, nullable=False),
        sa.Column(
            "saved_at",
            sa.DateTime(timezone=True),
            server_default=now_default,
            nullable=False,
        ),
    )
    op.create_index("ix_favorites_user_id", "favorites", ["user_id"])
    op.create_index("ix_favorites_saved_at", "favorites", ["saved_at"])


def downgrade() -> None:
    op.drop_table("favorites")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
