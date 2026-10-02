import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2026-04-22.dahlia",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    console.log("Webhook called. Signature present:", !!signature);
    console.log("Webhook secret length:", webhookSecret.length);

    if (!signature) {
      return new Response(JSON.stringify({ error: "No stripe-signature header" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const body = await req.text();
    console.log("Body length:", body.length);

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log("Event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : new Date();
        const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date();

        await supabase.from("stripe_subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "active",
          plan_type: "monthly",
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });

        await supabase
          .from("profiles")
          .update({
            is_active: true,
            subscription_expires: periodEnd.toISOString(),
            role: "subscriber",
          })
          .eq("id", userId);

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : new Date();
        const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date();

        const { data: subRecord } = await supabase
          .from("stripe_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (subRecord) {
          await supabase
            .from("stripe_subscriptions")
            .update({
              status: "active",
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          await supabase
            .from("profiles")
            .update({
              is_active: true,
              subscription_expires: periodEnd.toISOString(),
            })
            .eq("id", subRecord.user_id);

          console.log(`Subscription renewed for user ${subRecord.user_id}`);
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        const { data: subRecord } = await supabase
          .from("stripe_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (subRecord) {
          const isActive = subscription.status === "active";

          await supabase
            .from("stripe_subscriptions")
            .update({
              status: subscription.status,
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (!isActive) {
            await supabase
              .from("profiles")
              .update({
                is_active: false,
                role: "free",
              })
              .eq("id", subRecord.user_id);

            console.log(`Subscription cancelled/expired for user ${subRecord.user_id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
