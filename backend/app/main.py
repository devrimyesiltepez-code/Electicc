from datetime import date
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, engine, get_session
from . import models, schemas
from .seed import seed_data

app = FastAPI(title="Elektrik Proje Takip Paneli")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with next(get_session()) as session:
        seed_data(session)


async def verify_password(x_auth_token: str | None = Header(default=None)):
    if settings.app_password and x_auth_token != settings.app_password:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/customers", response_model=list[schemas.CustomerOut], dependencies=[Depends(verify_password)])
def list_customers(session: Session = Depends(get_session)):
    return session.query(models.Customer).order_by(models.Customer.name).all()


@app.post("/customers", response_model=schemas.CustomerOut, dependencies=[Depends(verify_password)])
def create_customer(payload: schemas.CustomerCreate, session: Session = Depends(get_session)):
    customer = models.Customer(name=payload.name, contact=payload.contact)
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


@app.get("/projects", response_model=list[schemas.ProjectOut], dependencies=[Depends(verify_password)])
def list_projects(session: Session = Depends(get_session)):
    return session.query(models.Project).all()


@app.get("/projects/{project_id}", response_model=schemas.ProjectOut, dependencies=[Depends(verify_password)])
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.post("/projects", response_model=schemas.ProjectOut, dependencies=[Depends(verify_password)])
def create_project(payload: schemas.ProjectCreate, session: Session = Depends(get_session)):
    project = models.Project(
        customer_id=payload.customer_id,
        name=payload.name,
        code=payload.code,
        status=payload.status,
        due_date=payload.due_date,
        priority=payload.priority,
        description=payload.description,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@app.post("/projects/{project_id}/tasks", response_model=schemas.TaskOut, dependencies=[Depends(verify_password)])
def create_task(project_id: int, payload: schemas.TaskCreate, session: Session = Depends(get_session)):
    project = session.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    task = models.Task(
        project_id=project_id,
        title=payload.title,
        status=payload.status,
        notes=payload.notes,
        due_date=payload.due_date,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.patch("/tasks/{task_id}", response_model=schemas.TaskOut, dependencies=[Depends(verify_password)])
def update_task(task_id: int, payload: schemas.TaskUpdate, session: Session = Depends(get_session)):
    task = session.get(models.Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    session.commit()
    session.refresh(task)
    return task


@app.post("/projects/{project_id}/file-links", response_model=schemas.FileLinkOut, dependencies=[Depends(verify_password)])
def create_file_link(project_id: int, payload: schemas.FileLinkCreate, session: Session = Depends(get_session)):
    project = session.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    link = models.FileLink(project_id=project_id, label=payload.label, path=payload.path)
    session.add(link)
    session.commit()
    session.refresh(link)
    return link


@app.post("/projects/{project_id}/revisions", response_model=schemas.RevisionNoteOut, dependencies=[Depends(verify_password)])
def create_revision(project_id: int, payload: schemas.RevisionNoteCreate, session: Session = Depends(get_session)):
    project = session.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    note = models.RevisionNote(project_id=project_id, note=payload.note, created_at=date.today())
    session.add(note)
    session.commit()
    session.refresh(note)
    return note
