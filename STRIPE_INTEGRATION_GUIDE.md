# Documentation d'Intégration Stripe (Custom Checkout)

Cette documentation est destinée à guider l'implémentation d'un système de paiement Stripe avec une page de paiement **intégrée directement sur le site** (sans redirection vers la page Hosted Checkout de Stripe).

L'architecture supposée est : **FastAPI (Backend)** + **React/TypeScript (Frontend)** + **Supabase (Base de données/Auth)**.

## 1. Préparation et Configuration

1. **Créer un compte Stripe** et récupérer les clés d'API standards :
   - `STRIPE_PUBLISHABLE_KEY` (commence par `pk_test_...`)
   - `STRIPE_SECRET_KEY` (commence par `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` (commence par `whsec_...`)
2. Ajouter ces clés dans les fichiers `.env` du backend et du frontend.
3. (Si abonnements) Créer les Produits et les Prix dans le dashboard Stripe et récupérer les ID des Prix (`price_...`).

## 2. Implémentation Backend (FastAPI)

### 2.1 Installation
```bash
pip install stripe
```

### 2.2 Initialisation
Dans FastAPI, configurer la clé Stripe :
```python
import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
```

### 2.3 Route de création d'intention de paiement (PaymentIntent)
Si vous vendez un abonnement vis-à-vis du service de candidature automatique, vous devez créer une **Subscription** incomplète et renvoyer le `client_secret` de l'Intent associé.

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter()

class CreateSubscriptionRequest(BaseModel):
    price_id: str
    user_id: str # Ou récupéré via le token d'auth Supabase

@router.post("/create-subscription")
async def create_subscription(req: CreateSubscriptionRequest):
    try:
        # 1. (Optionnel) Créer ou récupérer le client Stripe associé à l'utilisateur
        customer = stripe.Customer.create(
            metadata={'supabase_user_id': req.user_id}
        )
        
        # 2. Créer l'abonnement en mode "incomplete"
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": req.price_id}],
            payment_behavior='default_incomplete',
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
        )
        
        # 3. Récupérer le client_secret
        return {
            "subscriptionId": subscription.id,
            "clientSecret": subscription.latest_invoice.payment_intent.client_secret,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### 2.4 Webhooks (Très important)
Pour écouter les événements Stripe (ex: paiement réussi) de manière sécurisée et mettre à jour le statut "Premium" du client en base de données :

```python
from fastapi import Request

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Gérer les différents événements
    if event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        # TODO: Mettre à jour Supabase pour marquer l'utilisateur comme abonné
        customer_id = invoice.customer
        print(f"Paiement réussi pour le client {customer_id}")
        
    elif event['type'] == 'customer.subscription.deleted':
        # TODO: Retirer les accès Premium
        pass

    return {"status": "success"}
```

## 3. Implémentation Frontend (React/TypeScript)

Votre but est de garder l'utilisateur sur votre interface en utilisant **Stripe Elements**.

### 3.1 Installation
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 3.2 Le composant Formulaire de Paiement
Créez un composant pour le champ de paiement (ex: `CheckoutForm.tsx`) :

```tsx
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Redirection après le paiement (ou page de confirmation)
                return_url: `${window.location.origin}/payment-success`,
            },
        });

        if (error) {
            setMessage(error.message || "Une erreur est survenue");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4 border rounded-lg shadow-sm">
            <PaymentElement />
            <button 
                disabled={isLoading || !stripe || !elements} 
                className="mt-4 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {isLoading ? "Traitement en cours..." : "Payer et s'abonner"}
            </button>
            {message && <div className="mt-4 text-red-500">{message}</div>}
        </form>
    );
}
```

### 3.3 Page principale de Checkout
Sur votre page `/checkout`, vous devez d'abord appeler l'API pour récupérer le `clientSecret`, puis l'injecter dans le `Elements` provider :

```tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import CheckoutForm from './CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const [clientSecret, setClientSecret] = useState<string>('');

    useEffect(() => {
        // Appelez votre backend pour récupérer le clientSecret
        const fetchClientSecret = async () => {
            const res = await fetch('http://localhost:8000/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price_id: 'price_XXXXXX', user_id: 'user_123' }),
            });
            const data = await res.json();
            setClientSecret(data.clientSecret);
        };
        fetchClientSecret();
    }, []);

    const appearance = { theme: 'stripe' as const };
    const options = { clientSecret, appearance };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Souscrire au plan Premium</h1>
            {clientSecret ? (
                <Elements stripe={stripePromise} options={options}>
                    <CheckoutForm />
                </Elements>
            ) : (
                <div className="text-center">Chargement de la page de paiement sécurisée...</div>
            )}
        </div>
    );
}
```

## 4. Tests et Déploiement

1. Utiliser les **cartes de test Stripe** fournies dans la documentation officielle (ex: carte `4242 4242 4242 4242`).
2. Pour tester le webhook en local, utilisez le **Stripe CLI** :
   ```bash
   stripe listen --forward-to localhost:8000/webhook
   ```
3. En production : Assurez-vous d'utiliser vos clés Live (production) et d'ajouter l'URL de votre backend en tant que Webhook Endpoint sur le tableau de bord Stripe.
