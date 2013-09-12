class RoutesController < ApplicationController
  def index
  end

  def show
  end

  def new
    @route = Route.new :source => "StravaActivity", :source_id => params[:activity_id]
  end
  
  def create
    if params[:route][:source] == "StravaActivity"
      # Import the route from strava activity
      # todo: import from segment and from route
      @route = Route.import_from_activity(params[:route][:source_id])
      
      redirect_to edit_route_path(:id => @route.id)
    end
  end

  def edit
    @route = Route.find(params[:id])
  end

  def update
  end

  def destroy
  end
end
