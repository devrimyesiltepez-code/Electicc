from datetime import date
from pydantic import BaseModel


class CustomerBase(BaseModel):
    name: str
    contact: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    status: str
    notes: str | None = None
    due_date: date | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    notes: str | None = None
    due_date: date | None = None


class TaskOut(TaskBase):
    id: int

    class Config:
        from_attributes = True


class FileLinkBase(BaseModel):
    label: str
    path: str


class FileLinkCreate(FileLinkBase):
    pass


class FileLinkOut(FileLinkBase):
    id: int

    class Config:
        from_attributes = True


class RevisionNoteBase(BaseModel):
    note: str
    created_at: date


class RevisionNoteCreate(BaseModel):
    note: str


class RevisionNoteOut(RevisionNoteBase):
    id: int

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    customer_id: int
    name: str
    code: str
    status: str
    due_date: date | None = None
    priority: str
    description: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: int
    customer: CustomerOut
    tasks: list[TaskOut]
    file_links: list[FileLinkOut]
    revisions: list[RevisionNoteOut]

    class Config:
        from_attributes = True
