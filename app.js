const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ =   require("lodash");
const date = require(__dirname + "/date.js");
const app = express();

app.set("view engine", "ejs");


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");


const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  list: [itemsSchema]
};

const Item = mongoose.model("item", itemsSchema);
const List = mongoose.model("list", listSchema);

async function deleteDocumentById(documentId) {
  try {
    const result = await Item.findByIdAndDelete(documentId);
    if (result) {
      console.log('Document deleted successfully:', result);
    } else {
      console.log('Document not found.');
    }
  } catch (err) {
    console.error('Error deleting document:', err);
  }
}

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];



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
    }).then(function(foundData) {
      foundData.list.push(item);
      foundData.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.ListName;
  if(listName === "Today"){
    deleteDocumentById(checkedItemId);
    res.redirect("/");
  }
  else{
      const condition = {name:listName};
      //const itemToRemove = 'itemValue';
      const update = {
        $pull:{list:{_id: checkedItemId}}
      };
      const options = { new: true };

      List.findOneAndUpdate(condition, update, options)
        .then(updatedDocument => {
          if (!updatedDocument) {
            console.log('Document not found');
          } else {
            console.log('Item removed:', updatedDocument);
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });

    //List.findOneAndUpdate({name:listName},{$pull:{list:{_id: checkedItemId}}});
    res.redirect("/"+listName);
  }
});

app.get("/", function(req, res) {
  //let day = date();
  Item.find().then(function(foundData) {
    if (foundData.length == 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundData
      });
    }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }).then(function(foundData) {
    if (!foundData) {
      const list = new List({
        name: customListName,
        list: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundData.name,
        newListItems: foundData.list
      });
    }
  })


})

app.listen(3000, function() {
  console.log("server is running at port 3000");
});
