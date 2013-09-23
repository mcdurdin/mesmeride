class RouteImagesController < ApplicationController
  def index
  end

  def show
    @route_image = RouteImage.find(params[:id])
  end
  
  def destroy
    @route_image = RouteImage.find(params[:id])
    @route_image.destroy
    render :text => params[:id]
  end
  
  def download
    @route_image = RouteImage.find(params[:id])

    obj_name = @route_image.image.url.match(/(route_images.+)\?/)[1]
    
    s3 = AWS.s3
    object = s3.buckets['saved-routes'].objects[obj_name]
    download_url = object.url_for(:read,
      :response_content_disposition => "attachment; filename=#{@route_image.name}").to_s

    redirect_to download_url #  @route_image.save!
  end
end
