from datetime import date
from sqlalchemy import String, ForeignKey, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    contact: Mapped[str | None] = mapped_column(String(200), nullable=True)

    projects: Mapped[list["Project"]] = relationship(back_populates="customer")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50))
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[str] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer: Mapped[Customer] = relationship(back_populates="projects")
    tasks: Mapped[list["Task"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    file_links: Mapped[list["FileLink"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    revisions: Mapped[list["RevisionNote"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    project: Mapped[Project] = relationship(back_populates="tasks")


class FileLink(Base):
    __tablename__ = "file_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    label: Mapped[str] = mapped_column(String(200))
    path: Mapped[str] = mapped_column(String(500))

    project: Mapped[Project] = relationship(back_populates="file_links")


class RevisionNote(Base):
    __tablename__ = "revision_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    note: Mapped[str] = mapped_column(Text)
    created_at: Mapped[date] = mapped_column(Date)

    project: Mapped[Project] = relationship(back_populates="revisions")
