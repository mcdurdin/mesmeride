Rails.application.config.middleware.use OmniAuth::Builder do
  provider :strava, '81', ENV['STRAVA_SECRET_KEY'], {client_options: {ssl: {ca_file: Rails.root.join('lib/assets/cacert.pem').to_s}}}
  # provider :twitter, //later
  # provider :facebook, //later
end
