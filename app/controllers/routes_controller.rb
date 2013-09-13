class RoutesController < ApplicationController
  before_action :signed_in_user
  
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
      @route = Route.import_from_activity(params[:route][:source_id])
      
      #render :text => @route
      #return
      
      redirect_to edit_route_path(:id => @route.id)
    end
    # todo: import from segment and from route
  end

  def edit
    @route = Route.find(params[:id])
    # render :text => @route.waypoints.inspect
  end

  def update
    # waypoints = JSON.parse(params[:waypoints_field])
    # render :text => params.inspect
    @route = Route.find(params[:id])
    if @route.update_attributes(route_params)
      flash[:notice] = "Route saved."
      redirect_to edit_route_path(:id => @route.id)
    else
      render :action => 'edit'
    end    
  end

  def destroy
  end

  private
  
    def route_params
      params.require(:route).permit(:name, waypoints_attributes: [ :id, :name, :distance, :elevation, :_destroy ] )
    end
    
    def signed_in_user
      redirect_to root_url, notice: "Please sign in." unless signed_in?
    end
end
