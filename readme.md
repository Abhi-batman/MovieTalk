Hello
MISTAKES:

1->Using async keyword in async handler --> const asyncHandler=async ()=>(),makes it return a promise instead of a function,thus causing issues in router

2->using this keyword in arrow functions

3->Make sure to store both publicid and url in profilePhoto and change type of profilePhoto as object in model

4->sending multipart/form data in login causes multer to make the req.body empty,so either use upload.none() or just send json data through postman

5->No async on generating access/ refresh token in user model as they are synchronous functions and adding async will return a promise instead of the token
