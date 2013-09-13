class StaticPagesController < ApplicationController
  def home
    if signed_in?
      @routes = Route.find_all_by_user_id(@current_user.id)
      # render :text => @routes.inspect
    end
  end

  def help
  end

  def about
  end
  
  def contact
  end
  
  def signin
    redirect_to '/auth/strava'
  end
end
