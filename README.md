# Twilio Fax Server

Twilio Fax Server is a simple application that uses the Twilio Programmable Fax API to send and receive faxes. This application provides a web interface for managing faxes and allows you to configure Twilio account settings through the web interface.

## Features

- Send faxes using the Twilio Programmable Fax API
- Receive faxes and save them as PDF files
- Save sent faxes for future reference
- Send email and SMS notifications when a fax is received
- Web interface for configuring Twilio account settings
- Basic authentication for accessing the settings page
- Support for uploading files to send as faxes

## Requirements

- Docker
- A Twilio account with Programmable Fax enabled
- An email account for sending notifications

## Setup

### Step 1: Clone the repository

```sh
git clone https://github.com/yourusername/TwilioFaxServer.git
cd TwilioFaxServer
```

### Step 2: Build the Docker image

Build the Docker image using the following command:

```sh
docker build -t twilio-fax-app .
```

### Step 3: Run the Docker container

Run the Docker container using the following command:

```sh
docker run -d -p 3000:3000 --name twilio-fax-container twilio-fax-app
```

### Step 4: Configure Twilio

1. Log in to the [Twilio Console](https://www.twilio.com/console).
2. In the Programmable Fax settings, configure the Webhook URL to `http://localhost:3000/receive-fax`.

### Step 5: Access the Web Interface

Open your web browser and go to `http://localhost:3000` to access the Twilio Fax Server web interface.

### Authentication

The settings page is protected by basic authentication. The default credentials are:

- **Username**: `admin`
- **Password**: `yourpassword`

You can change these credentials in the `app.js` file.

## Usage

1. **Send Fax**: Go to the main page, select a Twilio phone number, enter the recipient's fax number, upload the fax file, and click "Send Fax".
2. **View Received Faxes**: The main page will display a list of received faxes. Click on the links to view the fax files.
3. **View Sent Faxes**: The main page will display a list of sent faxes. Click on the links to view the fax files.
4. **Configure Settings**: Go to the settings page to enter your Twilio account SID, auth token, email settings, and phone numbers.

## Contributing

Feel free to submit issues and pull requests with improvements.

## License

This project is licensed under the MIT License.

