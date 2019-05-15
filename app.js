//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const app = express();
const _ = require('lodash');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
    useNewUrlParser: true
});

// Items Schema
const itemsSchema = new mongoose.Schema({
    name: String
});

// Items model
const Item = new mongoose.model('Item', itemsSchema);

// Creating our first item documents
const item1 = new Item({
    name: 'Welcome to your TodoList!'
});

const item2 = new Item({
    name: "Add new items with the + sign"
});

const item3 = new Item({
    name: "<---------- delete items here"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Successfully added three items!');
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    });
});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});


app.post("/delete", function(req, res) {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemID, function(err) {
            if (!err) {
                console.log("Successfully deleted item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
                name: listName
            }, {$pull: {items: {_id: checkedItemID}}},
            function(err, foundList) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            });
    }
});



// List Schema
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

// List model
const List = mongoose.model("List", listSchema);

// Get route for custom route
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });

});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
