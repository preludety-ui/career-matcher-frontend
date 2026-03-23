import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICES = {
  monthly: {
    amount: 499,
    interval: "month" as const,
    name: "YELMA Propulse — Mensuel",
  },
  annual: {
    amount: 3999,
    interval: "year" as const,
    name: "YELMA Propulse — Annuel",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan, successUrl, cancelUrl } = await req.json();

    const price = PRICES[plan as keyof typeof PRICES];
    if (!price) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: price.name },
            unit_amount: price.amount,
            recurring: { interval: price.interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${req.headers.get("origin")}/success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}