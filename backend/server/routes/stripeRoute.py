import stripe
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import os

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@router.post("/stripe/create-checkout-session")
async def create_checkout_session(request: Request):
    data = await request.json()
    user_id = data.get("userId")
    plan = data.get("plan")
    price = data.get("price")
    email = data.get("email")

    if not user_id or not plan or price is None:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            customer_email=email,
            line_items=[{
                "price_data": {
                    "currency": "sgd",
                    "product_data": {"name": f"{plan}"},
                    "unit_amount": int(price * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"http://localhost:3000/#/success",
            cancel_url="http://localhost:3000/#/home/subscription",
            metadata={"userId": user_id, "plan": plan, "email": email}
        )
        return JSONResponse({"url": session.url})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})