class SessionsController < ApplicationController
  def create
    # render :text => request.env['omniauth.auth'].inspect
    
    auth = request.env['omniauth.auth']
    unless @auth = Authentication.find_from_hash(auth)
      # Create a new user or add an auth to existing user, depending on
      # whether there is already a user signed in.
      @auth = Authentication.create_from_hash(auth, current_user)
    end
    # Log the authorizing user in.
    sign_in @auth.user
    # self.current_user = @auth.user

    flash[:notice] = "Authentication successful; welcome, #{current_user.name}."
    redirect_to root_url
    # render :text => "Welcome, #{current_user.name}."
  end
  
  def destroy
    sign_out
    redirect_to root_url
  end
end
