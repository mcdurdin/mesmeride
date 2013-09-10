class SessionsController < ApplicationController
  def create
    # if we want to look at the data, here's where we can do it.
    # render :text => request.env['omniauth.auth'].inspect
    
    auth = request.env['omniauth.auth']
        
    unless @auth = Authentication.find_from_hash(auth)
      # Create a new user or add an auth to existing user, depending on
      # whether there is already a user signed in.
      @auth = Authentication.create_from_hash(auth, current_user)
    end
    
    # Log the authorizing user in.
    sign_in @auth.user

    # Tell them, and go home    
    flash[:notice] = "Welcome, #{current_user.first_name}."
    redirect_to root_url
  end
  
  def destroy
    sign_out
    redirect_to root_url
  end
end
