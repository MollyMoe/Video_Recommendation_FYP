import os
import ssl
import smtplib
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
from email.message import EmailMessage

load_dotenv()
print("EMAIL_USER:", os.getenv("EMAIL_USER"))
print("EMAIL_PASS:", os.getenv("EMAIL_PASS"))

router = APIRouter()

class SubscriptionIn(BaseModel):
    userId: str
    plan: str
    price: float
    cycle: str

class SubscriptionOut(BaseModel):
    userId: str
    cycle: str
    price: float
    plan: Optional[str] = None
    nextPayment: Optional[str] = None
    isActive: bool = False
    expiresOn: Optional[str] = None

def send_subscription_email(to_email: str, plan: str, cycle: str, price: float, nextPayment: str):
    EMAIL_USER = os.getenv("EMAIL_USER")
    EMAIL_PASS = os.getenv("EMAIL_PASS")

    message = EmailMessage()
    message.set_content(
        f"""Thank you for subscribing to the CineIt {plan}!

        Your Subscription Details:
        Cycle: {cycle}
        Price: SGD ${price:.2f}
        Next Payment Date: {nextPayment}

        Enjoy your premium features and happy streaming!

        –Best Regards,
        CineIt Support Team"""
    )
    message["Subject"] = f"Your CineIt {plan} is Confirmed!"
    message["From"] = EMAIL_USER
    message["To"] = to_email

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(message)
        print("✅ Confirmation email sent to", to_email)
    except Exception as e:
        print("❌ Email failed:", str(e))


@router.get("/subscription/{userId}", response_model=SubscriptionOut)
def get_subscription(userId: str, request: Request):
    db = request.app.state.support_db
    sub_col = db["subscription"]

    doc = sub_col.find_one({"userId": userId})
    if not doc:
        return SubscriptionOut(
            userId=userId,
            cycle="",
            price=0.0,
            plan=None,
            nextPayment=None,
            isActive=False,
            expiresOn=None
        )

    return SubscriptionOut(
        userId=userId,
        cycle=doc.get("cycle", ""),
        price=doc.get("price", 0.0),
        plan=doc.get("plan"),
        nextPayment=doc.get("nextPayment"),
        isActive=doc.get("isActive", False),
        expiresOn=doc.get("expiresOn")
    )


@router.post("/subscription/select")
def select_plan(payload: SubscriptionIn, request: Request):
    db = request.app.state.support_db
    sub_col = db["subscription"]
    user_db = request.app.state.user_db
    collection = user_db["streamer"]

    now = datetime.utcnow()
    next_date = now + timedelta(days=30 if payload.cycle == "Monthly" else 365)


    # Save subscription to DB
    sub_col.update_one(
        {"userId": payload.userId},
        {"$set": {
            "plan": payload.plan,
            "price": payload.price,
            "cycle": payload.cycle,
            "isActive": True,
            "nextPayment": next_date.strftime("%d %B %Y")
        }},
        upsert=True
    )

    # Fetch user's email
    user_doc = collection.find_one({"userId": payload.userId})
    if user_doc:
        if "email" in user_doc:
            send_subscription_email(user_doc["email"], payload.plan, payload.cycle, payload.price, next_date.strftime("%d %B %Y"))
        else:
            print("⚠️ Email field not found in user document")
    else:
        print("❌ User not found in user_db")

    return { "message": "Plan selected and email sent" }


@router.post("/subscription/cancel/{userId}")
def cancel_plan(userId: str, request: Request):
    db = request.app.state.support_db
    sub_col = db["subscription"]

    existing = sub_col.find_one({"userId": userId})
    if not existing:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Use nextPayment from DB if available
    expires_on = existing.get("nextPayment")
    if not expires_on:
        cycle = existing.get("cycle", "Monthly")
        days = 30 if cycle == "Monthly" else 365
        expires_on = (datetime.utcnow() + timedelta(days=days)).strftime("%d %B %Y")

    res = sub_col.update_one(
        {"userId": userId},
        {"$set": {
            "isActive": False,
            "expiresOn": expires_on
        }}
    )

    return { "message": "Subscription cancelled", "expiresOn": expires_on }


@router.get("/billing/{userId}")
def get_billing(userId: str, request: Request):
    db = request.app.state.user_db
    billing_col = db["billing"]

    doc = billing_col.find_one({"userId": userId}, {"_id": 0})
    return doc or {}

@router.put("/billing/{userId}")
def upsert_billing(userId: str, data: dict, request: Request):
    db = request.app.state.user_db
    billing_col = db["billing"]

    billing_col.update_one(
        {"userId": userId},
        {"$set": data},
        upsert=True
    )
    return { "message": "Billing saved" }
