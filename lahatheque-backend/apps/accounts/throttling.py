from rest_framework.throttling import UserRateThrottle

class PaymentThrottle(UserRateThrottle):
    scope = 'payment'

class SubmissionThrottle(UserRateThrottle):
    scope = 'submission'

class AuthThrottle(UserRateThrottle):
    scope = 'auth'
