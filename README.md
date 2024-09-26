## Prophy Medical Physics Management System

![Status Badge](https://img.shields.io/badge/Status-In%20Progress-yellow)

## Description

This application is a comprehensive web-based system designed for medical physics companies to manage their clients, schedule appointments, organize institutional materials, and handle billing efficiently. 

**This project is currently under development and is licensed exclusively for use by Prophy.**

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

## License

This software is developed by Leandro da Silva de Souza for **Prophy**.

### Ownership

The software and all associated intellectual property rights are the exclusive property of **Prophy**.

### Usage

This software is licensed exclusively to **Prophy**. It may only be used, distributed, or modified as per the agreements set forth by **Prophy**. Any unauthorized use, distribution, or modification is strictly prohibited.

### Distribution

This software is intended for internal use by **Prophy** and its authorized personnel. Redistribution outside of **Prophy** is not permitted unless explicitly authorized by **Prophy**.

### Modifications

Any modifications or derivative works based on this software must be approved by **Prophy**. All rights to such modifications or derivative works are retained by **Prophy** unless otherwise agreed.

### Support and Maintenance

Support and maintenance of this software will be provided according to the terms agreed upon with **Prophy**. Any issues or bugs should be reported to the designated support contact at **Prophy**.

### Warranty and Liability

This software is provided “as is,” without any express or implied warranties, including but not limited to the implied warranties of merchantability and fitness for a particular purpose. **Prophy** assumes no responsibility for the accuracy, reliability, or completeness of the software and does not warrant that the software will operate uninterrupted or be error-free.

In no event shall the developer be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of profits, business interruption, or loss of information, arising out of the use or inability to use the software. The total liability of the developer, whether in contract, tort, or otherwise, shall not exceed the amount paid by **Prophy** for the software.
