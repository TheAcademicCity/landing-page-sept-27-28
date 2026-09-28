# School Story Makers - Server

This is the Express.js server for the School Story Makers application, providing enhanced conversion tracking and analytics functionality.

## Features

- **Enhanced Conversions**: Track form submissions with hashed email and phone data
- **Google Tag Manager Integration**: Server-side GTM event tracking
- **Form Validation**: Email and phone number validation
- **CORS Support**: Configured for frontend integration
- **Error Handling**: Comprehensive error handling and logging

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
GTM_ID=GTM-579PCB3X
```

### Running the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Enhanced Conversions
- **POST** `/api/enhanced-conversion` - Send enhanced conversion data
- **POST** `/api/form-submission` - Track form submissions
- **POST** `/api/page-view` - Track page views
- **POST** `/api/event` - Send custom events

## API Usage Examples

### Enhanced Conversion
```javascript
const response = await fetch('http://localhost:3001/api/enhanced-conversion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    phone: '+1234567890'
  })
});
```

### Form Submission
```javascript
const response = await fetch('http://localhost:3001/api/form-submission', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    studentFirstName: 'John',
    studentLastName: 'Doe',
    phone: '+1234567890',
    email: 'john.doe@example.com',
    questions: 'Interested in admission'
  })
});
```

## Data Privacy

- Email addresses are hashed using SHA-256 before transmission
- Phone numbers are cleaned and formatted
- All sensitive data is handled securely
- No data is stored permanently on the server

## Error Handling

The server includes comprehensive error handling:
- Input validation
- Data format validation
- Server error responses
- Detailed logging for debugging

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173` (development)
- Your production domain (configure in `.env`)

## Security

- Helmet.js for security headers
- Input sanitization
- Rate limiting (can be added)
- CORS protection

## Monitoring

- Health check endpoint for monitoring
- Console logging for debugging
- Error tracking and reporting

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Update `CLIENT_URL` to your production domain
3. Use a process manager like PM2 for production
4. Configure reverse proxy (nginx) if needed

## Support

For issues or questions, please contact the development team.
