#!/bin/bash

# Configuration
URL="http://localhost:3000/api/whatsapp/webhook"
PHONE_NUMBER="1234567890"

echo "Running WhatsApp Webhook Local Test..."
echo "Simulating message: 'Hi book' from $PHONE_NUMBER"

# Mock WhatsApp Message Payload
PAYLOAD=$(cat <<EOF
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Test User"
                },
                "wa_id": "$PHONE_NUMBER"
              }
            ],
            "messages": [
              {
                "from": "$PHONE_NUMBER",
                "id": "wamid.HBgLMTIzNDU2Nzg5MBVBAhIAEhgDMUVGNEI5RTBEMTc1MTk1ODUzAA==",
                "timestamp": "$(date +%s)",
                "text": {
                  "body": "Hi book"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
EOF
)

# Send request using curl
curl -X POST "$URL" \
     -H "Content-Type: application/json" \
     -d "$PAYLOAD"

echo -e "\n\nTest complete. Check your server console for logs."
