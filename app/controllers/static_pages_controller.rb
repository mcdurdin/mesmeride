class StaticPagesController < ApplicationController
  def home
    if signed_in?
      @routes = Route.where(:user_id => @current_user.id).all # find_all_by_user_id(@current_user.id)
      # render :text => @routes.inspect
    end
  end

  def help
  end

  def about
  end
  
  def contact
  end
  
  def fb_channel
    render :text => '<script src="//connect.facebook.net/en_US/all.js"></script>'
  end
  
  def signin
    redirect_to '/auth/strava'
  end
end
