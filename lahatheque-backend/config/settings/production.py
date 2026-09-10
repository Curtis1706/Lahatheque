from decouple import config
from .base import *

DEBUG = False

PAYMENT_PROVIDER_TYPE = config('PAYMENT_PROVIDER_TYPE', default='moneroo')

