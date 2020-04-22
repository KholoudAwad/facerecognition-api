
const express = require ('express');
const cors = require ('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'smartbrain'
  }
});


//knex.select('*').from('users').then(data => console.log(data));

const app = express ();

app.use(cors());
app.use(express.json());

const database = {
	users :[
	{
		id:"123",
		name:"John",
		email:"john@gmail.com",
		password:"cookies",
		entries:0,
		joined: new Date()
	}, 
	{
		id:"124",
		name:"Sally",
		email:"Sally@gmail.com",
		password:"correct",
		entries:0,
		joined: new Date()
	},

	]
};

app.get('/', (req,res)=>{
	res.send(database.users);
});

app.post('/signin',(req,res) => {
	const {email , password}=req.body;

	if(!email || !password){
		return res.status(400).json("Incorrect form submission");
	}
 knex.select('email','hash').from('login')
	.where('email',email).then(user => {
		const isValid = bcrypt.compareSync(password,user[0].hash);
		if(isValid){
			return knex.select('*').from('users')
			.where('email',email)
			.then(data => {
			res.json(data[0]);})
			.catch(error => res.status(400).json("Couldn't fetch the user's profile"))
			
		}
		else {
			res.status(400).json("Wrong Credentials");
		}
	}).catch(err => res.status(400).json("Wrong Credentials"));
});

app.post('/register',(req,res) => {
	const {name, email , password} = req.body ;
	if(!email || !name || !password){
		return res.status(400).json("Incorrect form submission");
	}
	const hash = bcrypt.hashSync(password);

	knex.transaction(trx => {

		trx.insert({hash:hash , email:email})
		.into('login')
		.returning('email').then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
				name: name, 	
				email:email,
				joined: new Date()
			})
			.then(user => {res.json(user[0]);})//I used user[0] because I needthe object with all its properties

		})
		.then(trx.commit)
		.catch(trx.rollback)

	})
	.catch(err => {res.status(400).json("Unable to join");})
	
});

app.get('/profile/:id',(req,res) => {
	const {id} = req.params;
	
	knex('users').where('id',id).then(user => {
		if(user.length)
			{
				res.json(user[0]);
			}
		else {
			res.status(404).json("User not found");
		}
		
	}
	).catch(err => res.status(400).json("Error getting user")); //this one for the fault of the response not the user array if not found
	
});
 
 app.put('/image',(req,res) => {
 	const {id} = req.body;
 	knex('users')
 	.where('id',id).increment('entries',1)
 	.returning('entries')
 	.then(entries => {
 		res.json(entries[0]);

 	}).catch(err => res.status(400).json("Unable to get entries!"));
 });


app.listen(3000,()=>{
	console.log("app is running on port 3000")
}) ;