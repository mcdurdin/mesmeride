# Bypass SSL validation for now for strava (later, we can specify the SSL certificate path)

require 'openssl'
OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE
