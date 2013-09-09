class StaticPagesController < ApplicationController
  def home
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
