//建立資料庫連線
const mongo=require("mongodb")
const uri="mongodb+srv://root:root123@cluster0.elmdqqs.mongodb.net/?retryWrites=true&w=majority"
const client=new mongo.MongoClient(uri, {useNewUrlParser:true, useUnifiedTopology:true})
let db_comment=null
let db_member=null
async function initDB(){
	await client.connect()
	console.log("連線成功")
	db_comment=client.db("Comment")
    db_member=client.db("member-system")
	// 後續的資料庫操作
}
initDB()


//建立網站伺服器基礎設定
const express=require("express")
const app = express()
const session = require("express-session")
app.use(session({
    secret:"anything",
    resave:"false",
    saveUninitialized:true
}))
app.set("view engine","ejs")
app.set("views","./views")
app.use(express.static("public"))
app.use(express.urlencoded({extended:true}))
//建立需要的路由
app.get("/",function(req,res){
    res.render("index.ejs")
})

app.get("/member",async function(req,res){
    const name=req.session.member.name
    //取得所有會員的名稱
    const collection = await db_comment.collection("comment")
    let result=await collection.find({})
    let data_comment=[]
    await result.forEach(function(comment){
        data_comment.push(comment)
    })
   data_comment=data_comment.reverse()
   const collection_member=await db_member.collection("member")
   let result_member=await collection_member.find({})
   let data_member=[]
   await result_member.forEach(function(member){
       data_member.push(member)
   })

    res.render("member.ejs",{data_comment:data_comment,data_member:data_member,name:name})
})
app.get("/comment",async function(req,res){
    const name=req.session.member.name
    const comment=req.query.comment
    const date=new Date().getTime()
    const collection = await db_comment.collection("comment")
    let result=await collection.insertOne({
        name:name,
        comment:comment,
        date:date
    })
    res.redirect("/member")
})
app.get("/error",function(req,res){
    const msg=req.query.msg
    res.render("error.ejs",{msg:msg})
})
app.post("/signup",async function(req,res){
    const name=req.body.name
    const email=req.body.email
    const password=req.body.password
    
    //檢查資料庫中的資料
    const collection=db_member.collection("member")
    let result=await collection.findOne({
        email:email
    })
    if(result!==null){
        res.redirect("/error?msg=註冊失敗，信箱重複")
        return
    }
    result=await collection.insertOne({
        name:name,email:email,password:password
    })
    //新增成功，導回首頁
    res.redirect("/")
})
app.post("/signin",async function(req,res){
    const email=req.body.email
    const password=req.body.password
    //檢查資料庫中的資料
    const collection=db_member.collection("member")
    let result=await collection.findOne({
        $and:[
            {email:email},
            {password:password}
        ]
      })
    if(result===null){
        res.redirect("/error?msg=登入失敗，郵件或密碼輸入錯誤")
        return
    }
    req.session.member=result
    res.redirect("/member")
    
})
app.get("/signout",function(req,res){
    req.session.member=null
    res.redirect("/")
})

//啟動伺服器在 http://localhost:5000/
app.listen(5000,function(){
    console.log("Server Started")
})