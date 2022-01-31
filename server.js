const { aggregate } = require('./models/user');

const express               =  require('express'),
      app                   =  express(),
      alert                 =  require('alert'),
      mongoose              =  require("mongoose"),
      mongo                 =  require('mongodb');
      passport              =  require("passport"),
      bodyParser            =  require("body-parser"),
      LocalStrategy         =  require("passport-local"),
      passportLocalMongoose =  require("passport-local-mongoose"),
      User                  =  require("./models/user"),
      fs                    =  require('fs'),
      path                  =  require('path'),
                               require('dotenv/config');

const PORT = process.env.PORT || 8080;
// const url = 'mongodb://localhost:27017/gsms';
const uri = "mongodb+srv://admin:PIeFYhZzQYu8nAiW@freecluster.wmgkx.mongodb.net/freeCluster?retryWrites=true&w=majority";

const MongoClient = mongo.MongoClient;

app.set("view engine","ejs");
app.use(express.static('static'))
app.use(bodyParser.urlencoded(
    { extended:true }
))

mongoose.connect(uri);

app.use(require("express-session")({
    secret:"vompc",//decode or encode session
        resave: false,          
        saveUninitialized:false    
    }));


    passport.serializeUser(User.serializeUser());       //session encoding
    passport.deserializeUser(User.deserializeUser());   //session decoding
    passport.use(new LocalStrategy(User.authenticate()));
   
    app.use(passport.initialize());
    app.use(passport.session());




//=======================
//      R O U T E S
//=======================
app.get("/", (req,res)=>{
    res.render("login")
})

app.get("/register", (req,res)=>{
    res.render("register")
})

app.get("/login", (req,res)=>{
    res.render("login")
})
app.get("/home",isLoggedIn , (req,res)=>{

    console.log(req.user.userid)
    res.render("home",{ user: req.user })
})
app.get("/:id/shop",isLoggedIn , (req,res)=>{
    const { id } = req.params;
    console.log(id)
    res.render("shop",{ user: req.user, shopid: id })
})
app.get("/:id/products",isLoggedIn , (req,res)=>{
    const { id } = req.params;
    console.log(id)
    res.render("products",{ user: req.user, shopid: id })
})
app.get("/:id/employee",isLoggedIn , (req,res)=>{
    const { id } = req.params;
    console.log(id)
    res.render("employee",{ user: req.user, shopid: id })
})
app.get("/:id/supplier",isLoggedIn , (req,res)=>{
    const { id } = req.params;
    console.log(id)
    res.render("supplier",{ user: req.user, shopid: id })
})
app.get("/:id/bills",isLoggedIn , (req,res)=>{
    const { id } = req.params;
    console.log(id)
    res.render("bills",{ user: req.user, shopid: id })
})
app.get("/logout",(req,res)=>{
    req.logout();
    res.render("index")
});



app.post("/login",passport.authenticate("local",{
        successRedirect:"/home",
        failureRedirect:"/login"
    }),function (req, res){
});

app.post("/register",(req,res)=>{

    uid = Date.now();
    User.register(new User({
                            userid : uid,
                            username: req.body.username,
                            phone:req.body.phone,
                            email: req.body.email
                        }),
                        req.body.password,function(err,user){
        if(err){
            alert(err);
            console.log(err);
            res.render("register");
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/login");
        })    
    })
})

function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login"); 
}


app.get("/api/addNewShop" , (req,res)=>{
    var shopname = req.query.shopname
    var shopaddress = req.query.shopaddress
    var shopcontact = req.query.shopcontact
    var shopid = req.query.shopid

    console.log(req.query)

    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
       
        db.db("freeCluster").collection("shopDB").insertOne(req.query, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
          
        });

        res.sendStatus(200);
      });
})

app.get("/api/getShops" , (req,res)=>{
    var shopownerid = req.query.userid
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;                
        db.db("freeCluster").collection("shopDB").find({shopownerid: shopownerid}).toArray(function(err, result) {
            if (err) throw err;
            
            res.send(result);
            db.close();
          });
        
      });
})

app.get("/api/addNewProduct" , (req,res)=>{
    console.log(req.query)
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        
        db.db("freeCluster").collection("productDB").insertOne(req.query, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})

app.get("/api/updateProduct/:id" , (req,res)=>{
    const { id } = req.params;
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        var query = { _id : id };
        var newvalues = { $set: req.query };

        db.db("freeCluster").collection("productDB").updateOne(query,newvalues, function(err, res) {
          if (err) throw err;
          console.log("1 document updated");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})

app.get("/api/newStockBill/:id" , (req,res)=>{
    const { id } = req.params;
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        var query = { _id : id };
        var newvalues = { $set: req.query };
        var options = { upsert: true };
        db.db("freeCluster").collection("stockDB").updateOne(query,newvalues,options, function(err, res) {
          if (err) throw err;
          console.log("1 document updated");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})



app.get("/api/removeProduct/" , (req,res)=>{
   
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        console.log(req.query.productid)
        var myquery = req.query;
        db.db("freeCluster").collection("productDB").deleteOne(myquery, function(err, res) {
          if (err) throw err;
          console.log("1 document deleted.");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})

app.get("/api/getProductTypeCounts/:id" , (req,res)=>{
    const { id } = req.params;
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
      
      db.db("freeCluster").collection("productDB").aggregate([{$match:{"shopid": id }},{$unwind:"$producttype"},{$sortByCount:"$producttype"}]).toArray(function(err, result) {
        if (err) throw err;
        res.send(result);
        db.close();
      });
    });
})



app.get("/api/getProducts/:id" , (req,res)=>{
    const { id } = req.params;
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("productDB").find({shopid:id}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})

app.get("/api/getStockBills/:id" , (req,res)=>{
    const { id } = req.params;
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("stockDB").find({shopid:id}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})

app.get("/api/getStockBill/" , (req,res)=>{
   
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("stockDB").find(req.query).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})
app.get("/api/getProduct/:id" , (req,res)=>{
    const { id } = req.params;
    var sid = id.split("_")[0];
    var pid = id.split("_")[1];
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("productDB").find({$and : [{shopid:sid} , {productid:pid}]}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})

app.get("/api/getEmployee/:id" , (req,res)=>{
    const { id } = req.params;
    var sid = id.split("_")[0];
    var eid = id.split("_")[1];
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("employeeDB").find({$and : [{shopid:sid} , {employeeid:eid}]}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})

app.get("/api/getsupplier/:id" , (req,res)=>{
    const { id } = req.params;
    var sid = id.split("_")[0];
    var eid = id.split("_")[1];
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("supplierDB").find({$and : [{shopid:sid} , {supplierid:eid}]}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})

app.get("/api/updateEmployee/:id" , (req,res)=>{
    const { id } = req.params;
    var sid = id.split("_")[0];
    var eid = id.split("_")[1];
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;

          var query = {$and : [{shopid:sid} , {employeeid:eid}]};
          var newvalues = { $set: req.query };
        
          db.db("freeCluster").collection("employeeDB").updateOne(query,newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            db.close();
            
          });
          res.sendStatus(200);
      });
})

app.get("/api/updatesupplier/:id" , (req,res)=>{
    const { id } = req.params;
    var sid = id.split("_")[0];
    var eid = id.split("_")[1];
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;

          var query = {$and : [{shopid:sid} , {supplierid:eid}]};
          var newvalues = { $set: req.query };
        
          db.db("freeCluster").collection("supplierDB").updateOne(query,newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            db.close();
            
          });
          res.sendStatus(200);
      });
})

app.get("/api/addNewEmployee" , (req,res)=>{
    console.log(req.query)
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        
        db.db("freeCluster").collection("employeeDB").insertOne(req.query, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})

app.get("/api/addNewsupplier" , (req,res)=>{
    console.log(req.query)
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        db.db("freeCluster").collection("supplierDB").insertOne(req.query, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})


app.get("/api/getEmployees/:id" , (req,res)=>{
    const { id } = req.params;
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("employeeDB").find({shopid:id}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})

app.get("/api/getsuppliers/:id" , (req,res)=>{
    const { id } = req.params;
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
       
        db.db("freeCluster").collection("supplierDB").find({shopid:id}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result)
            res.send(result);
            db.close();
          });
        
      });
})


app.get("/api/removeEmployee/" , (req,res)=>{
   
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        console.log(req.query.productid)
        var myquery = req.query;
        db.db("freeCluster").collection("employeeDB").deleteOne(myquery, function(err, res) {
          if (err) throw err;
          console.log("1 document deleted.");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})

app.get("/api/removesupplier/" , (req,res)=>{
   
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;

        var myquery = req.query;
        db.db("freeCluster").collection("supplierDB").deleteOne(myquery, function(err, res) {
          if (err) throw err;
          console.log("1 document deleted.");
          db.close();
          
        });
        res.sendStatus(200);
    
      });
})

app.get("/api/getSupplierList" , (req,res)=>{
    var shopid = req.query.shopid
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;                
        db.db("freeCluster").collection("supplierDB").find({shopid: shopid}).toArray(function(err, result) {
            if (err) throw err;
            
            res.send(result);
            db.close();
          });
        
      });
})

//Listen On Server
app.listen(PORT,()=>{
    console.log(`Listening on port ${PORT}`)
});
