import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = os.environ.get("SMTP_PORT", 587)
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "") # Mot de passe d'application (si Gmail)

def send_auto_apply_report(user_email: str, applied_jobs: list):
    """
    Ancien système de compte-rendu journalier.
    """
    pass

def send_single_application_alert(user_email: str, job: dict, cv_path: str = None):
    """
    Envoie un email en temps réel dès qu'une candidature est soumise.
    Lie explicitement le CV utilisé dans la notification.
    """
    if not SMTP_USER or not SMTP_PASS:
        print(f"[SIMULATION EMAIL INDIVIDUEL] Destinataire: {user_email} | Job: {job.get('titre')}")
        return

    titre = job.get('titre', 'Offre non spécifiée')
    entreprise = job.get('entreprise_lieu', 'Entreprise anonyme')
    lien = job.get('lien', '#')
    
    cv_text = "Votre CV par défaut a été automatiquement transmis au recruteur."
    if cv_path:
        cv_text = f"Le CV que nous avons transmis au recruteur pour cette offre est sauvegardé sous le lien : <b>{cv_path}</b>."

    msg = MIMEMultipart()
    msg['From'] = f"Seekra Pilote Automatique 🤖 <{SMTP_USER}>"
    msg['To'] = user_email
    msg['Subject'] = f"🚀 Nouvelle candidature soumise : {titre} chez {entreprise}"

    html = f"""
    <html>
      <body style="font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; background-color: #f1f5f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #0052FF; margin-top: 0;">Bonjour,</h2>
            <p>Notre Pilote Automatique 🤖 vient tout juste de postuler à une nouvelle offre d'emploi très pertinente pour vous !</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0052FF; margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 8px; color: #0f172a;">{titre}</h3>
                <p style="margin: 0 0 10px 0; color: #475569;"><strong>Lieu/Entreprise :</strong> {entreprise}</p>
                <a href="{lien}" style="display: inline-block; background-color: #0052FF; color: #ffffff; text-decoration: none; font-weight: bold; padding: 10px 16px; border-radius: 6px; font-size: 14px;">Consulter l'annonce originale ➡️</a>
            </div>

            <p style="padding: 12px; background-color: #f0fdf4; color: #166534; border-radius: 6px; font-size: 14px;">✅ {cv_text}</p>
            
            <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                Gardez un œil sur votre <a href="http://localhost:3000/auto-apply" style="color: #0052FF;">journal des candidatures</a> pour suivre l'historique complet.<br>
                À très vite,<br><strong>L'équipe Seekra</strong>
            </p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, int(SMTP_PORT))
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, user_email, msg.as_string())
        server.quit()
        print(f"Email individuel envoyé avec succès à {user_email} pour {titre}")
    except Exception as e:
        print(f"Erreur d'envoi d'email individuel à {user_email}: {e}")

