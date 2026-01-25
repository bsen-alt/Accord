Accord

Accord is a policy-first identity and access engine designed to unify identity representation, context resolution, and authorization under a single, declarative policy model.

Installation

`bashnpm install accord`

Quick Start

1. Initialize Configuration

   Create a config folder in your project root.

config/policies.json`json[ { "id": "policy-admin", "version": "1.0", "effect": "allow", "subject": { "type": "user", "attributes": { "role": "admin" } }, "action": ["delete"], "resource": { "type": "booking" } }]`

config/identities.json`json[ { "id": "admin_01", "type": "user", "status": "active", "attributes": { "role": "admin" } }]`

2. Use in Code

````typescriptimport

const accord = new Accord({ policyPath: './config/policies.json', identityPath: './config/identities.json'});

async function deleteBooking(bookingId: string, userId: string) { const decision = await accord.check(userId, 'delete', { type: 'booking', id: bookingId });

if (decision.decision === 'allow') { console.log('Access Granted'); // Perform delete... } else { console.log('Access Denied:', decision.reason); }}```

Express Middleware
Protect your routes easily:

```typescriptimport express from 'express';import { Accord } from 'accord';import { protect } from 'accord/adapters/express'; // Note: Check actual path after build

const app = express();const accord = new Accord({ policyPath: './config/policies.json', ... });

// Protect this routeapp.delete('/bookings/:id', protect({ accordInstance: accord, action: 'delete', resourceType: 'booking' }), (req, res) => { // Only allowed users reach here res.send('Booking deleted'); });```

CLI Tool
Validate policies locally:

```bashnpx accord-cli validate ./config/policies.json```

Test access logic:

```bashnpx accord-cli eval -i user_123 -a delete -r booking```

License
ISC
````

