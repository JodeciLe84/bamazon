var mysql = require('mysql')
var inquirer = require('inquirer')
var prompt = inquirer.createPromptModule()
var figlet = require('figlet');
// Connections
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'bamazon',
  port: 3306
})

connection.connect(function (e) {
  if (e) throw e
  //Welcome
  figlet('Hello World!!', function (err, data) {
    if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
    }
    console.log(data)
    figlet.text('Welcome to \n BAMAZON', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    }, function (err, data) {
      if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
      }
      console.log(data);
      start()
    });
  })
});

// global var
var IntId
var IntQuantity
var currentItems = []
var purchaseId

//starting function
var start = function () {
  var qs = [{
      type: 'input',
      name: 'productId',
      message: "Please select the id number for the product you'd like to buy!",
      validate: function (val) {
        if (isNaN(val) === false) {
          return true;
        } else {
          return false
        }
      }
    },
    {
      type: 'input',
      name: 'amount',
      message: "Great!, \n How many would you like?",
      validate: function (val) {
        if (isNaN(val) === false) {
          return true
        } else {
          return false
        }
      }
    }
  ]
  // Collecting values from database and creating a list
  connection.query('SELECT * FROM products', function (e, r) {
    if (e) throw e
    for (var i = 0; i < r.length; i++) {
      currentItems.push(r[i].item_id)
      console.log(r[i].item_id + ' | ' + r[i].product_name + ' | ' + r[i].department_name + ' | ' + '$' + r[i].price + ' | ' + r[i].stock_quantity)
    }
    prompt(qs).then(answers => {
      var tempId = parseInt(answers.productId)
      if (currentItems.indexOf(tempId) > -1) {
        IntId = parseInt(answers.productId)
        IntQuantity = parseInt(answers.amount)
        purchaseId = answers.productId
        checkInventory()
      } else {
        console.log('\n Please enter a valid ID Item number.')
        start()
      }
    })
  })
}
//Inventory Check function
function checkInventory() {
  var rQuery = 'SELECT product_name, price, stock_quantity FROM products WHERE ?'
  connection.query(rQuery, {
    item_id: purchaseId
  }, function (e, r) {
    var skQuantity = r[0].stock_quantity
    var price = r[0].price
    var proName = r[0].product_name
    if (skQuantity < IntQuantity) {
      console.log(`Insufficient quantity! Sorry we only have ${skQuantity} in Stock, Please pick chose another amount.`)
      start()
    } else {
      var newQuantity = skQuantity - IntQuantity
      var update = 'UPDATE products SET ? WHERE?'
      var udQuantity = [{
          stock_quantity: newQuantity
        },
        {
          product_name: proName
        }
      ]
      connection.query(update, udQuantity, function (e) {
        if (e) {
          console.log(e)
        }
        var total = IntQuantity * price
        console.log(`You have purchased ${IntQuantity} ${proName}
your Total is $${total}.`)
        rebuy()
      })
    }
  })
}
//rebuy function
var rebuy = function () {
  var rebuyQs = {
    type: 'list',
    name: 'rebuy',
    message: `Thank You for your purchase!
    What would you like to do?`,
    choices: ['Continue shopping', 'Exit App']
  }
  prompt([rebuyQs]).then(function (r) {
    if (r.rebuy == 'Continue shopping') {
      start()
    }else if(r.rebuy == 'Exit App'){
      console.log('Thank you for using BAMAZON!, goodbye')
      connection.end()
    }
  })
}
// setTimeout