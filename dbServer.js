const express = require("express")
const app = express()
const mysql = require("mysql")

require("dotenv").config()
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT
const db = mysql.createPool({
   connectionLimit: 100,
   host: DB_HOST,
   user: DB_USER,
   password: DB_PASSWORD,
   database: DB_DATABASE,
   port: DB_PORT
})

app.use(express.static(__dirname + '/public'));

const port = process.env.PORT
app.listen(port, 
()=> console.log(`Server Started on port ${port}...`))

const bcrypt = require("bcrypt")
app.use(express.json())
app.use(express.urlencoded({ extended: true}))
//middleware para ler os dados do form: req.body.<parametro>


//Criar usuário
app.post("/registro", async (req,res) => {
const user = req.body.nome;
const email = req.body.email;
const senhaEncrip = await bcrypt.hash(req.body.senha,10);


db.getConnection( async (err, connection) => {
 if (err) throw (err)
 const sqlSearch = "SELECT * FROM usuario WHERE email = ?"
 const search_query = mysql.format(sqlSearch,[email])
 const sqlInsert = "INSERT INTO usuario (email, senha, nome) VALUES (?,?,?)"
 const insert_query = mysql.format(sqlInsert,[email, senhaEncrip, user])
 // ? é substituído por valores
 // ?? é substituído por string

 await connection.query (search_query, async (err, result) => {
  if (err) throw (err)
  console.log("------> Buscando resultados")
  console.log(result.length)
  if (result.length != 0) {
   connection.release()
   console.log("------> Email já está cadastrado")
   res.sendStatus(409) 
  } 
  else {
   await connection.query (insert_query, (err, result)=> {
   connection.release()
   if (err) throw (err)
   console.log ("--------> Novo usuário cadastrado")
   console.log(result.insertId)
   res.sendStatus(201)
  })
 }
}) //fechamento do connection.query()
}) //fechamento do db.getConnection()
}) //fechamento do app.post()


//Login (autenticação do usuário)
app.post("/login", (req, res)=> {
   const email = req.body.email
   const senha = req.body.senha
   db.getConnection ( async (err, connection)=> {
    if (err) throw (err)
    const sqlSearch = "Select * from usuario where email = ?"
    const search_query = mysql.format(sqlSearch,[email])
    await connection.query (search_query, async (err, result) => {
     connection.release()
     
     if (err) throw (err)
     if (result.length == 0) {
      console.log("--------> Usuário não existe")
      res.sendStatus(404)
     } 
     else {
        const senhaEncrip = result[0].senha
        //get the hashedPassword from result
       if (await bcrypt.compare(senha, senhaEncrip)) {
       console.log("---------> Login bem sucedido")
       res.send(`${email} está logado!`)
       } 
       else {
       console.log("---------> Senha incorreta!")
       res.send("Senha incorreta!")
       } //end of bcrypt.compare()
     }//end of User exists i.e. results.length==0

   }) //fechamento do connection.query()
   }) //fechamento do db.getConnection()
   }) //fechamento do app.post()