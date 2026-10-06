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
    - oauth2 [google] - social app
    - validation [Zod,Joi,Yup,class-validator]
    - error handling [AppError]
    - rate limiting. [nginx]
    - load balancer. [nginx]

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


* todo Session1:

- register.
- send email [nodemailer]
- generate OTP.

=========================

* todo Session2:

- refactor send email.
- verify an account switch isVerified to true.
- login and pass token using cookie.
- resend otp.[in-case otp expired, in-case reset password]

===========================

* todo Session3:

- customize app error.
- intro to Dependency inversion principle. [class] SOLID >> functions
- reset password.

==============================

* todo Session4:

- validation using Zod

===============================

* todo Session5:

- social login using Google.
    - get idToken from FE.
    - verify idToken. ask Google
    - get payload from IdToken. {id,name,pp,email,dob,phone}
    - if user exist >> generate token.
    - if user not exist >> create user >> generate token.

================================

* todo session6:

1. refactor the code structure.✅
    - lib: common functions which related to my app[ngl].
    - pkg: common packages which related to any app.[base-code]
    - express - bcrypt - jsonwebtoken >> ngl

2. caching.✅
    - mandatory features.
    - reduce latency. FE <-> BE <-> DB.
    - avoid frequent DB queries.
    - datastructures >> hash-map. [key-value]
    - mandatory to apply to invalidate cache. [Create, update, delete]
3. custom config.✅
4. withCache middleware.[intercept]✅
5. idempotency.
6. correlationId.
7. mailJet.

=================================

* regex:
    - email:
        - /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail){1}+\.[a-zA-Z]{2,}$/