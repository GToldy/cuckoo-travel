const User = require("../models/user");
const Hotel = require("../models/hotel");
const Order = require("../models/order")
const Passport = require("passport");

//Express validator
const { check, validationResult } = require("express-validator");
const { body } = require("express-validator");

const querystring = require("querystring");
const hotel = require("../models/hotel");
const order = require("../models/order");

exports.signUpGet = (req, res) => {
    res.render("sign_up", { title: "User sign up" });
}

exports.signUpPost = [
    //Validate the user's data
    check("first_name")
        .isLength({ min: 1 })
        .withMessage("First name must be specified")
        .isAlphanumeric()
        .withMessage("First name must be alphanumeric"),

    check("last_name")
        .isLength({ min: 1 })
        .withMessage("Last name must be specified")
        .isAlphanumeric()
        .withMessage("Last name must be alphanumeric"),

    check("email")
        .isEmail()
        .withMessage("Invalid email address"),

    check("confirm_email")
        .custom((value, { req }) => value === req.body.email)
        .withMessage("Email addresses do not match"),

    check("password")
        .isLength({ min: 6 })
        .withMessage("Invalid password, it must be at least 6 characters"),
    
    check("confirm_password")
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords do not match"),

    body("*").trim().escape(),
    
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            //There are errors
            res.render("sign_up", { title: "Please fix the following errors:", errors: errors.array() });
            return
        } else {
            //No errprs
            const newUser = new User(req.body);
            User.register(newUser, req.body.password, function(err) {
                if (err) {
                    console.log("Error while registering", err);
                    return next(err);
                }
                next(); //Logs in user after signing up
            });
        }
    }
]

exports.logInGet = (req, res) => {
    res.render("login", {title: "Log in to continue"});
}

exports.logInPost = Passport.authenticate("local", {
    successRedirect: "/",
    successFlash: "You are now logged in",
    failureRedirect: "/login",
    failureFlash: "Login failed, please try again"
});

exports.logout = (req, res) => {
    req.logout();
    req.flash("info", "You are now logged out");
    res.redirect("/");
}

exports.bookingConfirmation = async (req, res, next) => {
    try {
        const data = req.params.data;
        const searchData = querystring.parse(data);
        const hotel = await Hotel.find({_id: searchData.id})
        res.render("confirmation", {title: "Confirm your booking", hotel, searchData})
    } catch(errors) {
        next(errors)
    }
}

exports.orderPlaced = async (req, res, next) => {
    try {
        const data = req.params.data;
        const parsedData = querystring.parse(data);
        const order = new Order({
            user_id: req.user._id,
            hotel_id: parsedData.id,
            order_details: {
                duration: parsedData.duration,
                dateOfDeparture: parsedData.dateOfDeparture,
                numberOfGuests: parsedData.numberOfGuests
            }
        });
        await order.save();
        req.flash("info", "Thank you, your order has been placed");
        res.redirect("/my-account");
    } catch(errors) {
        next(errors)
    }
}

exports.myAccount = async (req, res, next) => {
    try {
        const orders = await Order.aggregate([
            {$match: {user_id: req.user.id}},
            {$lookup: {
                from: "hotels",
                localField: "hotel_id",
                foreignField: "_id",
                as: "hotel_data"
            }}
        ]);
        res.render("user_account", {title: "My account", orders});
    } catch(errors) {
        next(errors)
    }
}

exports.allOrders = async (req, res, next) => {
    try {
        const orders = await Order.aggregate([
            {$lookup: {
                from: "hotels",
                localField: "hotel_id",
                foreignField: "_id",
                as: "hotel_data"
            }}
        ]);
        res.render("orders", {title: "All orders", orders});
    } catch(errors) {
        next(errors)
    }
}

exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        next();
        return;
    }
    res.redirect("/");
}