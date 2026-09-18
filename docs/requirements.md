# NGL APP [anonymous-messaging-app]

* send anonymous messages or public messages.
* view a profile with related messages.
* handle manage messages.

- tech stack:
    - express
    - javascript
    - mongodb/mongoose
    - redis [caching]
    - nodemailer [email]
    - jwt [authentication]
    - bcrypt [password hash]
    - oauth2 [google]
    - validation [Zod,Joi,Yup,class-validator]
    - error handling [AppError]
    - rate limiting.
    - load balancer.

- OTP:
    - delete OTP after 10 min.
    - delete OTP after usage.
    - store OTP temporarily:[time to live]
        - database using mongodb support TTL.
        - into cache redis support TTL.[ram] x50 faster more DB.
- TODO:
    - link:
        - verify email:
            - /api/v1/auth/verify-email/:token
        - login:
            - /api/v1/auth/login

- features:
    - authentication flow:
        - register
        - verify email using OTP.
        - login.
        - reset password.
        - send OTP.
        - login with Google.
        - logout.
    - message flow:
        - send a message. [anonymous – public]
        - view message.
        - delete message. [soft-delete/archive]
    - user flow [me]:
        - view profile.[me]
        - edit profile.[me]
        - delete profile.[me]
    - guards:
        - authentication.[token]