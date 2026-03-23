import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature error:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Abonnement créé ou activé
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      // Récupérer l'email du client Stripe
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const email = customer.email;

      if (email) {
        const plan = status === "active" ? "propulse" : "gratuit";
        
        const { error } = await supabaseAdmin
          .from("candidats")
          .update({ plan })
          .eq("email", email);

        if (error) console.error("Supabase update error:", error);
        else console.log(`Plan mis à jour: ${email} → ${plan}`);
      }
    }

    // Abonnement annulé
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const email = customer.email;

      if (email) {
        await supabaseAdmin
          .from("candidats")
          .update({ plan: "gratuit" })
          .eq("email", email);
        
        console.log(`Abonnement annulé: ${email} → gratuit`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

