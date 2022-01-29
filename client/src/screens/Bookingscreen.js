import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Error from "../components/Error";
import Loader from "../components/Loader";
import moment from "moment";
import StripeCheckout from "react-stripe-checkout";
import Swal from "sweetalert2";

import AOS from "aos";
import "aos/dist/aos.css"; // You can also use <link> for styles
// ..
AOS.init({ duration: 1000 });

var URL;

function Redirect() {
  window.location.href = URL;
}

function Bookingscreen() {
  const { _id, todate, fromdate } = useParams();
  const [isloading, setisloading] = useState(true);
  const [haserror, sethaserror] = useState();
  const [room, setroom] = useState(_id);

  const checkin = moment(fromdate, "DD-MM-YYYY");
  const checkout = moment(todate, "DD-MM-YYYY");
  const totaldays = moment.duration(checkout.diff(checkin)).asDays() + 1;
  useEffect(() => {
    const fetchData = async () => {
      if (!localStorage.getItem("currentUser")) {
        setisloading(true);
        window.location.href = "/login";
        setisloading(false);
      }

      setisloading(true);
      sethaserror(false);
      try {
        const data = (
          await axios.post("/api/rooms/getroombyid", { roomid: _id })
        ).data;
        setroom(data.room);
      } catch (error) {
        console.log(error);
        sethaserror(true);
      }
      setisloading(false);
    };
    fetchData();
  }, [setroom]);
  const totalamount = totaldays * room.rentperday;
  async function onToken(token) {
    // console.log(token);
    const bookingDetails = {
      room,
      userid: JSON.parse(localStorage.getItem("currentUser"))._id,
      fromdate,
      todate,
      totalamount,
      totaldays,
      token,
    };

    try {
      setisloading(true);
      const result = (
        await axios.post("/api/bookings/bookroom", bookingDetails)
      ).data;
      setisloading(false);

      console.log("hello3");
      localStorage.setItem("authLink", JSON.stringify(result));
      const authLink = JSON.parse(localStorage.getItem("authLink")).authLink;
      console.log(authLink);
      URL = authLink;
      // window.open(authLink, "_blank").focus();
      // console.log("hello4");

      Swal.fire(
        "Congratulations",
        "Your room booked successfully",
        "success"
      ).then((result) => {
        // console.log("hello3");
        // localStorage.setItem("authLink", JSON.stringify(result));
        // const authLink = JSON.parse(localStorage.getItem("authLink"));
        // console.log(authLink);
        // console.log("hello4");
        // window.location.href = authLink;
        // setTimeout("Redirect()", 5000);
        window.location.href = "/profile";
      });
      window.location.href = "/profile";
    } catch (error) {
      setisloading(false);
      Swal.fire("Oops", "Something went wrong", "error");
    }
  }
  return (
    <div className="m-5" data-aos="flip-left">
      {isloading ? (
        <h1>
          <Loader />
        </h1>
      ) : room ? (
        <div>
          <div className="row justify-content-center mt-5 bs">
            <div className="col-md-7">
              <h1> {room.name}</h1>
              <img src={room.imageurls[0]} className="bigimg" />
            </div>
            <div className="col-md-5" style={{ float: "right" }}>
              <div style={{ textAlign: "right" }}>
                <h1>BOOKING DETAILS</h1>
                <hr />
                <b>
                  <p>
                    Name :{" "}
                    {JSON.parse(localStorage.getItem("currentUser")).name}
                  </p>
                  <p>From Date: {todate}</p>
                  <p>To Date:{fromdate}</p>
                  <p>Max Count: {room.maxcount}</p>
                </b>
              </div>
              <div style={{ textAlign: "right" }}>
                <b>
                  <h1>Amount</h1>
                  <hr />
                  <p>Total Days:{totaldays}</p>
                  <p>Rent Per Day:{room.rentperday}</p>
                  <p>Total Amount: {totalamount}</p>
                </b>
              </div>
              <div style={{ float: "right" }}>
                <StripeCheckout
                  amount={totalamount * 100}
                  token={onToken}
                  currency="INR"
                  stripeKey="pk_test_51KLPWOSAXdfi0yIcMWO557zaenxO6QM3bLwGhpI0h2qVm2JwLj3mvnbpc5lzeG8uKd5XQN0cDhczSJguyvNzVxtN00FzWdPOiK"
                >
                  <button className="btn btn-primary">Pay Now </button>
                </StripeCheckout>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Error message="Something went wrong, please try again later!" />
      )}
    </div>
  );
}
export default Bookingscreen;
