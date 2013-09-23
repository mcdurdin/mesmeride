require 'tempfile'

class RoutesController < ApplicationController
  before_action :signed_in_user
  
  def index
  end

  def show
  end

  def new
    if params[:effort_id].nil?
      @route = Route.new :source => "StravaActivity", :source_id => params[:activity_id], :user_id => current_user.id, :zoom => 25, :x_scale => 25, :y_scale => 25
    else
      @route = Route.new :source => "StravaEffort[#{params[:effort_id]}]", :source_id => params[:activity_id], :user_id => current_user.id, :zoom => 25, :x_scale => 25, :y_scale => 25
    end
  end
  
  def create
    strava_effort = params[:route][:source].match /^StravaEffort\[(\d+)\]$/
    if !strava_effort.nil? || params[:route][:source] == "StravaActivity"
      if !strava_effort.nil? 
        effort_id = strava_effort[1]
      else
        effort_id = nil
      end
      
      # return render :text => effort_id
            
      # Import the route from strava activity
      @route = Route.import_from_activity(params[:route][:source_id], current_user.id, effort_id)
    end
    
    redirect_to edit_route_path(:id => @route.id)
  end

  def edit
    @route = Route.find(params[:id])
    #@route.waypoints.
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
  
  def image_save
    # data:image/png;base64,
    data = params[:data]
    data = params[:data].match(/^data\:(.+?);base64,(.+)$/)
    
    name = params[:name].gsub(/[^a-zA-Z0-9_. -]/, '') + '.png'
    
    response.headers['Content-Type'] = data[1]
    response.headers['Content-Disposition'] = "attachment; filename=\"#{name}\""
    
    render :text => Base64.decode64(data[2])
  end
  
  def image_permalink
    @route = Route.find(params[:id])
    
    if @route.route_images.length >= RouteImage::MAX_IMAGES_PER_ROUTE
      render :text => [
        :error => "You can only save at most #{RouteImage::MAX_IMAGES_PER_ROUTE} images per route."
      ].to_json
      # , :status => 403, :layout => false
      return
    end

    data = params[:data]
    data = params[:data].match(/^data\:(.+?);base64,(.+)$/)
    
    name = params[:name].gsub(/[^a-zA-Z0-9_. -]/, '') # + '.png'

 
    Tempfile.open([name, '.png']) do |f|
      f.binmode
      f.write Base64.decode64(data[2])
      f.rewind
      
      @route_image = RouteImage.create(:route_id => @route.id, :image => f)
      @route_image.save!
    end
    
    
#  @route_image.download_url = object.url_for(:read,
#    :response_content_disposition => "attachment; filename=#{name}").to_s
#  @route_image.save!
                   
    
    render :partial => 'route_image', :locals => { :route_image => @route_image }
#    render :text => [
#      :route_image_id => @route_image.id, 
#      :url => @route_image.image.url, 
#      :url_small => @route_image.image.url(:small),
#      :url_download => download_url
#      ].to_json
  end
  
  private
  
    def route_params
      params.require(:route).permit(
        :name, :x_scale, :y_scale, :zoom, :renderer, :renderer_options, :crop_start_distance, :crop_stop_distance,
        waypoints_attributes: [ :id, :name, :distance, :elevation, :_destroy ]
      )
    end
    
    def signed_in_user
      redirect_to root_url, notice: "Please sign in." unless signed_in?
    end
end
