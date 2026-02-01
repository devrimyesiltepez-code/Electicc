from datetime import date, timedelta

from sqlalchemy.orm import Session

from . import models


def seed_data(session: Session) -> None:
    if session.query(models.Customer).count() > 0:
        return

    customer = models.Customer(name="Akdeniz Enerji", contact="akdeniz@example.com")
    customer2 = models.Customer(name="Marmara Endüstri", contact="marmara@example.com")
    session.add_all([customer, customer2])
    session.flush()

    project1 = models.Project(
        customer_id=customer.id,
        name="Fabrika Trafo Revizyonu",
        code="AE-TR-001",
        status="Çizimde",
        due_date=date.today() + timedelta(days=21),
        priority="Yüksek",
        description="Tek hat şeması ve ekipman yerleşim revizyonu.",
    )
    project2 = models.Project(
        customer_id=customer.id,
        name="AVM Aydınlatma Otomasyonu",
        code="AE-LUX-014",
        status="Planlandı",
        due_date=date.today() + timedelta(days=45),
        priority="Orta",
        description="DALI kontrol panelleri ve sensör yerleşimi.",
    )
    project3 = models.Project(
        customer_id=customer2.id,
        name="Depo Jeneratör Projesi",
        code="ME-GEN-203",
        status="Revizyonda",
        due_date=date.today() + timedelta(days=10),
        priority="Kritik",
        description="Yük paylaşımı ve otomatik transfer panosu güncellemesi.",
    )
    session.add_all([project1, project2, project3])
    session.flush()

    tasks = [
        models.Task(
            project_id=project1.id,
            title="Trafo yük hesapları",
            status="Doing",
            notes="Güncel yük listesi talep edildi.",
            due_date=date.today() + timedelta(days=7),
        ),
        models.Task(
            project_id=project1.id,
            title="Tek hat şema revizyonu",
            status="ToDo",
            notes="IEC 61439 standardı kontrol edilecek.",
            due_date=date.today() + timedelta(days=14),
        ),
        models.Task(
            project_id=project2.id,
            title="Saha keşif raporu",
            status="Done",
            notes="Sensör noktaları belirlendi.",
            due_date=date.today() - timedelta(days=3),
        ),
        models.Task(
            project_id=project3.id,
            title="ATS pano çizimi",
            status="Blocked",
            notes="Tedarikçi çizimleri bekleniyor.",
            due_date=date.today() + timedelta(days=5),
        ),
    ]
    session.add_all(tasks)

    session.add_all(
        [
            models.FileLink(
                project_id=project1.id,
                label="Revizyon klasörü",
                path="C:/Elektrik/Projeler/AE-TR-001/Revizyon",
            ),
            models.FileLink(
                project_id=project1.id,
                label="Tek hat PDF",
                path="C:/Elektrik/Projeler/AE-TR-001/tek-hat.pdf",
            ),
            models.FileLink(
                project_id=project3.id,
                label="Jeneratör teknik döküman",
                path="https://example.com/jenerator-spec",
            ),
        ]
    )

    session.add_all(
        [
            models.RevisionNote(
                project_id=project1.id,
                note="MCC panosu için ilave kesici eklendi.",
                created_at=date.today() - timedelta(days=2),
            ),
            models.RevisionNote(
                project_id=project3.id,
                note="Transfer panosu kablo kesitleri güncellendi.",
                created_at=date.today() - timedelta(days=1),
            ),
        ]
    )

    session.commit()
