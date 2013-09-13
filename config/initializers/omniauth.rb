Rails.application.config.middleware.use OmniAuth::Builder do

  def secret_key
    ENV['STRAVA_SECRET_KEY']
#    ||
#    begin
#      token_file = Rails.root.join('.strava_secret_key')
#      File.read(token_file).chomp
#    end
  end

  provider :strava, '81', secret_key, {client_options: {ssl: {ca_file: Rails.root.join('lib/assets/cacert.pem').to_s}}}
end
