# Twilio Fax Manager

Twilio Fax Manager is a simple application to send and receive faxes using the Twilio Programmable Fax API. The application provides a web interface for managing faxes and allows you to configure Twilio account settings through the web interface.

## Features

- Send faxes using Twilio Programmable Fax API
- Receive faxes and save them as PDF files
- Send email and SMS notifications when a fax is received
- Web interface to configure Twilio account settings
- Basic authentication for accessing the settings page
- File upload support for sending faxes

## Requirements

- Docker
- A Twilio account with Programmable Fax enabled
- An email account for sending notifications

## Setup

### Step 1: Clone the repository

```sh
git clone https://github.com/FlytheWorldNow/TwilioFaxServer.git
cd TwilioFaxServer


### Step 2:

```sh
docker build -t twilio-fax-app .


### Step 3:

```sh
docker run -d -p 3000:3000 --name twilio-fax-container twilio-fax-app
