const Twilio = require('twilio');
const express = require('express');
const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = Twilio(accountSid, authToken);

// Store call status in-memory (or use a database in production)
const callStatuses = {};

router.post('/call', (req, res) => {
  const { to } = req.body;

  client.calls
    .create({
      url: process.env.TWILIO_CALL_URL,
      to: to,
      from: process.env.TWILIO_VERIFIED_NUMBER,
      statusCallback: `${process.env.SERVER_URL}/call-status`,
      statusCallbackEvent: ['completed'],
    })
    .then((call) => {
      console.log('Call initiated:', call.sid);
      callStatuses[call.sid] = 'initiated';
      res.json({ message: 'Call initiated', callSid: call.sid });
    })
    .catch((error) => {
      console.error('Error initiating call:', error);
      res.status(500).json({ error: 'Failed to initiate call' });
    });
});

const fetchCallStatusFromTwilio = async (callSid) => {
  try {
    const call = await client.calls(callSid).fetch();
    return call.status;
  } catch (error) {
    console.error('Error fetching call status from Twilio:', error);
    return null;
  }
};

router.get('/call-status/:callSid', async (req, res) => {
  const { callSid } = req.params;
  let status = callStatuses[callSid];
  if (status) {
    // Fetch latest status from Twilio if the stored status is "initiated"
    status = await fetchCallStatusFromTwilio(callSid);
    if (status) {
      callStatuses[callSid] = status;
    }
  }

  if (['completed', 'no-answer'].includes(status)) {
    try {
      const call = await client.calls(callSid).fetch();

      const usageRecords = await client.calls.list({
        startTime: new Date(call.startTime),
        endTime: new Date(call.endTime),
        limit: 1,
      })
      
      const callRecord = usageRecords.find(record => record.sid === callSid);
      
      console.log('Call details:', usageRecords, 'call record',callRecord);

      const billingInfo = {
        duration: call.duration || '0',
        price: callRecord?.price || '0.00',
        currency: callRecord?.price_unit || 'USD',
      };

      return res.json({
        status,
        billing: billingInfo,
      });
      
    } catch (error) {
      console.error('Error fetching call details:', error);
      return res.status(500).json({
        status,
        error: 'Failed to fetch billing details',
      });
    }
  }

  res.json({ status: status || 'initiated' });
});

module.exports = router;
