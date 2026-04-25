import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def send_auto_apply_report(user_email: str, applied_jobs: list):
    """
    Legacy daily summary system.
    """
    _ = (user_email, applied_jobs)
    return None


def send_single_application_alert(user_email: str, job: dict, cv_path: str | None = None):
    """
    Send an email immediately after an application is submitted.
    """
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL SIMULATION] recipient={user_email} | job={job.get('titre')}")
        return

    title = job.get("titre", "Job offer")
    company = job.get("entreprise_lieu", "Company")
    link = job.get("lien", "#")

    cv_text = "Your default CV was transmitted automatically."
    if cv_path:
        cv_text = f"The CV used for this application is stored at: <b>{cv_path}</b>."

    msg = MIMEMultipart()
    msg["From"] = f"Seekra Auto Apply <{SMTP_USER}>"
    msg["To"] = user_email
    msg["Subject"] = f"New application sent: {title} at {company}"

    html = f"""
    <html>
      <body style="font-family: Inter, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; background-color: #f1f5f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px;">
            <h2 style="color: #0052FF; margin-top: 0;">Hello,</h2>
            <p>Your Auto-Apply bot just submitted a new application.</p>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0052FF; margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 8px; color: #0f172a;">{title}</h3>
                <p style="margin: 0 0 10px 0; color: #475569;"><strong>Company/Location:</strong> {company}</p>
                <a href="{link}" style="display: inline-block; background-color: #0052FF; color: #ffffff; text-decoration: none; font-weight: bold; padding: 10px 16px; border-radius: 6px; font-size: 14px;">Open original offer</a>
            </div>

            <p style="padding: 12px; background-color: #f0fdf4; color: #166534; border-radius: 6px; font-size: 14px;">{cv_text}</p>

            <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                Review your application log:
                <a href="{FRONTEND_BASE_URL}/auto-apply" style="color: #0052FF;">auto-apply dashboard</a>.
            </p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, user_email, msg.as_string())
        server.quit()
        print(f"Email sent to {user_email} for {title}")
    except Exception as exc:
        print(f"Email delivery error for {user_email}: {exc}")


def send_apply_outcome_email(
    user_email: str,
    job: dict,
    outcome: str,
    detail: str | None = None,
    screenshot_path: str | None = None,
) -> None:
    """
    Notification honnête après tentative d'auto-candidature.
    outcome: applied | failed | needs_manual
    """
    title = job.get("titre", "Offre")
    company = job.get("entreprise_lieu", "")
    link = job.get("lien", job.get("url", "#"))

    bodies = {
        "applied": (
            "<p>Le robot a <strong>soumis un formulaire</strong> sur la page de l’offre (succès probable). "
            "Vérifiez sur le site recruteur que la candidature est bien enregistrée.</p>"
        ),
        "failed": (
            "<p>La <strong>candidature automatique a échoué</strong>. "
            "Consultez le tableau de bord auto-apply et postulez manuellement si besoin.</p>"
        ),
        "needs_manual": (
            "<p>Cette offre nécessite une <strong>étape manuelle</strong> (site externe, connexion, captcha, etc.). "
            "Ouvrez le lien ci-dessous pour finaliser.</p>"
        ),
    }
    extra = ""
    if detail:
        extra = f'<p style="color:#64748b;font-size:14px;">Détail : {detail}</p>'
    shot = ""
    if screenshot_path:
        shot = f"<p style=\"font-size:13px;color:#64748b;\">Capture enregistrée côté serveur : {screenshot_path}</p>"

    subjects = {
        "applied": f"Candidature automatique — {title}",
        "failed": f"Échec auto-candidature — {title}",
        "needs_manual": f"Action requise — {title}",
    }
    subject = subjects.get(outcome, subjects["needs_manual"])
    body_html = bodies.get(outcome, bodies["needs_manual"])

    if not SMTP_USER or not SMTP_PASS:
        print(
            f"[EMAIL SIMULATION] outcome={outcome} recipient={user_email} job={title} detail={detail!r}"
        )
        return

    msg = MIMEMultipart()
    msg["From"] = f"Seekra Auto Apply <{SMTP_USER}>"
    msg["To"] = user_email
    msg["Subject"] = subject
    html = f"""
    <html>
      <body style="font-family: Inter, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; background-color: #f1f5f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px;">
            <h2 style="color: #0052FF; margin-top: 0;">Seekra</h2>
            {body_html}
            {extra}
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px 0;">{title}</h3>
                <p style="margin: 0; color: #475569;">{company}</p>
                <a href="{link}" style="display:inline-block;margin-top:12px;background:#0052FF;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold;">Ouvrir l’offre</a>
            </div>
            {shot}
            <p style="color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                Tableau de bord : <a href="{FRONTEND_BASE_URL}/auto-apply" style="color:#0052FF;">auto-apply</a>.
                Les sites tiers imposent souvent des conditions d’utilisation : assurez-vous d’y être conforme.
            </p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, user_email, msg.as_string())
        server.quit()
        print(f"Outcome email ({outcome}) sent to {user_email}")
    except Exception as exc:
        print(f"Email delivery error for {user_email}: {exc}")
