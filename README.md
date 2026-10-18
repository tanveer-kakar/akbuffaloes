# AK Buffalo

## Local development

The application uses a Node.js API and a local SQLite database. It requires Node.js 24 or later (`node:sqlite`).

1. Copy `.env.example` to `.env.local` and set a private `ADMIN_PASSWORD` (at least 8 characters; 12 or more is recommended). The configured admin account is created on the first backend start.
2. In one terminal, run `npm run server`.
3. In another terminal, run `npm run dev` and open the Vite URL.

The backend stores account and business data in `server/data/ak-buffalo.sqlite`, and uploaded avatars in `server/uploads/`. Both are local, persistent files and are excluded from version control. The first admin password is read only by the backend and is never exposed to the browser.

The local backend does not send email verification or password-reset messages. Users can change their password from Settings after signing in; a locked-out user must contact the administrator. For production, put the API behind HTTPS and configure persistent storage and backups for the SQLite and upload directories.

## Email notifications

Email notifications are sent by the backend—not the browser—when a user registers, submits a buffalo enquiry, requests a consultation, sends a Contact Us message, or when an admin changes a request's status. Each new request starts as **Pending**; admins can **Accept**, **Confirm**, **Complete**, or **Reject** it in the Admin Panel, and the user receives a status-update email.

To enable delivery, add a valid SMTP credential to `.env.local` and restart `npm run server`:

```ini
SMTP_PASS=your-gmail-app-password
# Optional when the sending account differs from the administrator inbox:
SMTP_USER=your-sending-address@example.com
ADMIN_NOTIFY_EMAIL=your-admin-inbox@example.com
```

For Gmail, use a Google App Password rather than the account password. Without `SMTP_PASS`, the application continues to record requests but deliberately does not attempt delivery.

## Buffalo enquiries

Each of the 10 breed collections is initialized with verified buffalo profiles across both the 10 Breed Catalog (BRD-001 to BRD-010) and New Stocks (AKB-001 to AKB-008). Visitors select **Send Enquiry** to submit their contact information and a message; this does not create an order or charge a customer. Enquiries are available in the admin panel under **Enquiries**.

## Website overview

📘 WEBSITE DOCUMENTATION
Buffaloes Business Website (Based on Reference Video)
1. Project Overview

Website Type: Livestock / Buffalo Farming Business Website
Purpose:
To promote a buffalo dairy business, showcase buffalo breeds, build trust through testimonials, display gallery, and allow customers to book consultations or contact the business.

2. Target Audience

Dairy farmers

Buffalo buyers

Milk industry professionals

Local customers interested in buffalo breeds

3. Technology Stack

Frontend: React, TypeScript, Vite

Backend: Node.js built-in HTTP server

Database: SQLite

Admin Panel: Application dashboard with server-side role checks

4. Website Pages & Navigation
Top Navigation Menu

Home

About

Buffaloes

Gallery

Contact Us

Call Now (CTA button)

5. Home Page (Main Landing Page)
Sections Included:
5.1 Hero Section

Large full-width banner image with buffaloes

Brand logo on top-left

Navigation bar on top

Strong visual focus on buffalo strength & quality

5.2 Introduction / Brand Trust

Text highlighting:

Trusted buffalo dairy brand

Quality breeds

Years of experience

6. Book a Consultation Section
Section Title

“Schedule a Call Today!”

Form Fields

Name

Phone Number

Email Address

Button

“Submit Now” / “Send Message”

Functionality

Data saved to database

Admin can view submissions

Redirect user after submission

7. About / Trust Section
Content

“A Trusted Name in Dairy Industry”

Short description of:

Business values

Experience

Quality assurance

Visual

Buffalo image or brand logo beside text

8. Buffaloes Page
Content

High-quality buffalo images

Information about breeds

Focus on:

Health

Strength

Milk capacity

9. Testimonials Section
Layout

Card-based testimonial design

Testimonial Details

Customer name

Short feedback

Star ratings

Small avatar icon

Purpose

Build customer trust

Show satisfied clients

10. Gallery Page
Features

Image grid layout

Filters:

Photos

Videos (optional)

Content

Farm images

Buffalo images

Customer interaction photos

11. Contact Us Page
Layout: Two Columns
Left Side – Contact Information

Location (Address)

Phone Number

Email Address

Right Side – Contact Form

Name

Phone Number

Email

Message

“Send Now” button

12. Admin Panel Requirements
Admin Can:

View consultation requests

View contact form messages

See:

Name

Phone

Email

Delete or manage entries

13. Database Design
Table 1: Consultation Requests

id

name

email

phone

Table 2: Contact Messages

id

name

phone

email

message

14. UI / Design Style

Green & dark theme (agriculture feel)

Clean layout

Large readable fonts

Mobile responsive

Professional business look

15. Security Features

CSRF protection

Django ORM

Admin authentication

16. Optional Enhancements

WhatsApp “Call Now” button

Google Maps integration

Email notifications

Success message after form submit

SEO optimization

17. End Goal

A professional buffalo dairy website that:

Looks strong & trustworthy

Converts visitors into inquiries

Allows admin to manage leads

Can be expanded later


“Create a modern buffalo dairy business website based on this documentation.”

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
