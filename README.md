<p align="center">
   <img width="150" height="150" src="frontend/public/images/prophy-icon.png" alt="Prophy Logo">
</p>

<h1 align="center">Prophy Medical Physics Management System</h1>

<div align="center">

![Status Badge](https://img.shields.io/badge/Status-In%20Progress-yellow)

</div>

<div align="center">

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Django REST Framework](https://img.shields.io/badge/Django_REST_Framework-092E20?style=for-the-badge&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-17202C?style=for-the-badge&logo=cypress&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![RTK Query](https://img.shields.io/badge/RTK_Query-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)
![DigitalOcean](https://img.shields.io/badge/DigitalOcean-0080FF?style=for-the-badge&logo=digitalocean&logoColor=white)

</div>

## Description

This application is a comprehensive web-based system designed for medical physics companies to manage their clients, schedule appointments, organize institutional materials, and handle billing efficiently. 

**This project is currently under development.**

## Technologies Used

* **Backend:** Django, Django REST Framework
* **Frontend:** React, Next.js, TypeScript
* **Testing:** Postman and Cypress
* **Database:** PostgreSQL
* **State Management:** Redux
* **Data Fetching and Caching:** RTK Query
* **Form Validation:** Zod
* **Authentication:** JWT (JSON Web Token)
* **Styling:** Tailwind CSS
* **Design:** Figma
* **Deployment:** DigitalOcean

## Detailed Features

### User Authentication and Authorization

* **Secure user registration and login system.**
* **Role-based access control (RBAC) with the following user profiles:**
    * **Prophy Manager:** Full access to all features.
    * **Comercial**: Access to clients data (read-only), reports (read-only) and proposal of contracts (add/edit/read)
    * **Internal Medical Physicist:** Access to most features, including client-specific data, institutional materials, and scheduling.
    * **Client Manager:** Access to their own institution's data, equipment information, schedules (read-only), and invoices (read-only).
    * **Unit Manager:**  Assigned by clients to manage specific units, with access limited to their assigned units' data.
    * **External Medical Physicist:** Limited access to schedules (read-only) and client data (read-only) associated with their assigned appointments.

### Client Management

* **Client Registration Form:**
    * Allows approved clients to submit their information and request services.
    * Data is stored in a separate table of proposals for tracking and follow-up of non-clients.
* **Clients Dashboard:**
    * Clients can register and manage their institution's information:
        * CNPJ (Brazilian company ID)
        * Institution details
        * Contact details
        * Units and responsible managers
        * Equipment inventory
    * Updating data needs approval from someone in the Prophy Staff
* **Client Data Management (Internal Staff):**
    * Internal staff can view, edit, and manage client data:
        * Client details
        * Units
        * Equipments
        * Invoices (including download options and payment status updates)
    * Advanced filtering options for efficient data retrieval.

### Scheduling and Appointments

* **Appointment Scheduling:**
    * Internal staff can schedule appointments, specifying:
        * Date and time
        * Client
        * Equipment involved
        * Tests to be performed
        * Appointment status (scheduled, completed)
    * Google Calendar integration for seamless scheduling and reminders.
* **Appointment Views:**
    * Clients and assigned external physicists can view their scheduled appointments.
    * Notifications and reminders via email and Google Calendar integration.

### Equipment and Test Management

* **Equipment Inventory:**
    * Clients can add and manage their equipment inventory if approved by internal staff, including details such as:
        * Modality
        * Brand, manufacturer, model
        * Serial number
        * ANVISA registration (Brazilian health regulatory agency)
        * Photos 

### Institutional Materials

* **Material Management:**
    * Internal staff can upload and manage institutional materials:
        * PDFs
        * Video links
        * Categorization by client profile and diagnostic modality
    * Access control to ensure only authorized users can view and download materials.

### Billing and Invoices

* **Invoice Generation:**
    * System generates invoices based on services provided.
    * Internal staff can manage invoice details and payment status.
* **Payment Tracking:**
    * Clients can view their invoices, download copies, and upload payment confirmations.
    * Automated reminders for overdue payments.

## Project Status and Future Development

The project is actively in development. There's 5 stages of development:

* **1:** User authentication and client registration.
* **2:** Client data management and viewing for both internal staff and clients.
* **3:** Appointment scheduling and Google Calendar integration.
* **4:** Equipment and test management, including report uploads and notifications.
* **5:** Institutional materials management and access control.

Future development will include:

* **Enhanced reporting and analytics.**
* **Mobile app for clients and staff.**
* **Continuous improvement based on user feedback.**
