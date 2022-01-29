const express = require("express");
const router = express.Router();
const Booking = require("../model/booking");
const Room = require("../model/room");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const { route } = require("express/lib/application");
const stripe = require("stripe")(
  "sk_test_51KLPWOSAXdfi0yIceUK6gRm7GePbfRkWQoFUaudkA97YvT7WPo2Mo9EBGofpl5RJOywE1O3SajHbuLmYQ438P3h700vvzuqite"
);
router.post("/bookroom", async (req, res) => {
  const { room, userid, fromdate, todate, totalamount, totaldays, token } =
    req.body;
  try {
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    /*stripe.handleCardPayment('{PAYMENT_INTENT_CLIENT_SECRET}', {
            payment_method: '{PAYMENT_METHOD_ID}',
        })
            .then(function (result) {
                // Handle result.error or result.paymentIntent
            });*/
    const payment = await stripe.paymentIntents.create(
      {
        payment_method: token.card.id,
        amount: totalamount * 100,
        currency: "inr",
        customer: customer.id,
        receipt_email: token.email,
      },
      {
        idempotencyKey: uuidv4(),
      }
    );
    // console.log(payment);
    // console.log("Hello");
    intent = await stripe.paymentIntents.confirm(payment.id);
    // console.log(intent);
    // console.log("Hello2");
    var authLink = intent.next_action.use_stripe_sdk.stripe_js;
    // console.log(authLink);
    // stripe.handleCardPayment();
    /*stripe.confirmCardPayment(idempotencyKey).then(function (res) {
            if (res.error) {
                console.log("Error");
            } else if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
                console.log('Payment Successfull, Enjoy your stay!');
            }
        });*/
    /*const payment = await stripe.charges.create(
            {
                amount: totalamount * 100,
                customer: customer.id,
                currency: 'INR',
                receipt_email: token.email
            }, {
            idempotencyKey: uuidv4()
        }
        )*/
    //res.render('checkout', { client_secret: intent.client_secret });
    //console.log(payment);

    if (intent) {
      //response.paymentIntent.status === 'succeeded';
      const newbooking = new Booking({
        room: room.name,
        roomid: room._id,
        userid,
        fromdate,
        todate,
        totalamount,
        totaldays,
        transactionId: "1234",
      });

      const booking = await newbooking.save();
      const curroom = await Room.findOne({ _id: room._id });
      curroom.currentbookings.push({
        bookingid: booking._id,
        fromdate: fromdate,
        todate: todate,
        userid: userid,
        status: booking.status,
      });
      await curroom.save();
    }
    var msg = "Payment Successfull, Enjoy your stay!";
    res.send({ msg, authLink });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/getbookingsbyuserid", async (req, res) => {
  const userid = req.body.userid;

  try {
    const bookings = await Booking.find({ userid: userid });
    res.send(bookings);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

router.post("/cancelbooking", async (req, res) => {
  const { bookingid, roomid } = req.body;

  try {
    const bookingItem = await Booking.findOne({ _id: bookingid });
    bookingItem.status = "cancelled";
    await bookingItem.save();

    const room = await Room.findOne({ _id: roomid });
    const bookings = room.currentbookings;

    const temp = bookings.filter(
      (booking) => booking.bookingid.toString() !== bookingid
    );
    room.currentbookings = temp;

    await room.save();

    res.send("Your booking cancelled succesfully");
  } catch (error) {
    return res.status(400).json({ error });
  }
});

router.get("/getallbookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.send(bookings);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

module.exports = router;
