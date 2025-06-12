"""
fal.ai Media Generation Tool

This tool integrates with fal.ai to generate images and videos using their API.
Based on the fal.ai Python client documentation: https://docs.fal.ai/clients/python
"""

import asyncio
import os
import aiohttp
from datetime import datetime
from typing import Dict, Any, List, Optional
import fal_client
from pydantic import BaseModel, Field

from agentpress.tool import ToolResult, openapi_schema
from sandbox.tool_base import SandboxToolsBase
from utils.logger import logger


class FalMediaRequest(BaseModel):
    """Request model for fal.ai media generation"""
    prompt: str = Field(description="The text prompt for media generation")
    model_id: str = Field(description="The fal.ai model ID (e.g., 'fal-ai/flux/dev')")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducible results")
    image_size: Optional[str] = Field(default="landscape_4_3", description="Image size/aspect ratio")
    num_images: Optional[int] = Field(default=1, description="Number of images to generate")
    num_inference_steps: Optional[int] = Field(default=None, description="Number of inference steps")
    guidance_scale: Optional[float] = Field(default=None, description="Guidance scale for generation")


class FalMediaResponse(BaseModel):
    """Response model for fal.ai media generation"""
    success: bool
    images: List[str] = Field(default_factory=list, description="URLs of generated images")
    videos: List[str] = Field(default_factory=list, description="URLs of generated videos")
    error: Optional[str] = Field(default=None, description="Error message if generation failed")
    request_id: Optional[str] = Field(default=None, description="fal.ai request ID for tracking")
    saved_files: List[str] = Field(default_factory=list, description="Paths to saved files in workspace")


class FalMediaTool(SandboxToolsBase):
    """Tool for generating images and videos using fal.ai"""

    def __init__(self, project_id: str, thread_id: str, thread_manager=None):
        super().__init__(project_id, thread_manager)
        self.thread_id = thread_id

    def _is_video_model(self, model_id: str) -> bool:
        """Check if the model generates videos"""
        video_keywords = ['video', 'runway', 'pika', 'sora', 'stable-video']
        return any(keyword in model_id.lower() for keyword in video_keywords)

    def _prepare_arguments(self, request: FalMediaRequest) -> Dict[str, Any]:
        """Prepare arguments for fal.ai API based on model type"""
        args = {
            "prompt": request.prompt,
        }

        # Add optional parameters if provided
        if request.seed is not None:
            args["seed"] = request.seed
        
        if request.image_size:
            args["image_size"] = request.image_size
            
        if request.num_images and request.num_images > 1:
            args["num_images"] = request.num_images
            
        if request.num_inference_steps:
            args["num_inference_steps"] = request.num_inference_steps
            
        if request.guidance_scale:
            args["guidance_scale"] = request.guidance_scale

        return args

    async def _generate_media_async(self, model_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Generate media using fal.ai async client"""
        try:
            # Use the subscribe method for queue-based processing (recommended)
            result = await fal_client.subscribe_async(
                model_id,
                arguments=arguments,
                with_logs=True
            )
            return result
        except Exception as e:
            # Fallback to direct run if subscribe fails
            try:
                result = await fal_client.run_async(
                    model_id,
                    arguments=arguments
                )
                return result
            except Exception as fallback_error:
                raise Exception(f"Both subscribe and run failed. Subscribe error: {str(e)}, Run error: {str(fallback_error)}")

    async def _download_and_save_image(self, image_url: str, prompt: str, model_id: str, seed: Optional[int] = None) -> str:
        """Download an image from URL and save it to the workspace"""
        try:
            logger.info(f"Ensuring sandbox is available for image saving...")
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            logger.info(f"Sandbox available (ID: {self.sandbox_id}). Proceeding with image download.")
            
            # Create images directory if it doesn't exist
            images_dir = f"{self.workspace_path}/generated_images"
            self.sandbox.fs.create_folder(images_dir, "755")
            
            # Generate filename with timestamp and model info
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_name = model_id.split('/')[-1] if '/' in model_id else model_id
            seed_suffix = f"_seed{seed}" if seed is not None else ""
            filename = f"{timestamp}_{model_name}{seed_suffix}.png"
            file_path = f"{images_dir}/{filename}"
            
            # Download the image
            logger.info(f"Downloading image from {image_url} to {file_path}")
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status == 200:
                        image_data = await response.read()
                        
                        # Save to workspace
                        self.sandbox.fs.upload_file(file_path, image_data)
                        
                        # Return relative path for display
                        relative_path = f"generated_images/{filename}"
                        logger.info(f"✅ Image saved to workspace: {relative_path}")
                        return relative_path
                    else:
                        logger.error(f"Failed to download image: HTTP {response.status}")
                        raise Exception(f"Failed to download image: HTTP {response.status}")
                        
        except Exception as e:
            logger.error(f"❌ Error in _download_and_save_image: {str(e)}", exc_info=True)
            raise e

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "fal_media_generation",
            "description": "Generate images and videos using fal.ai's powerful AI models including FLUX, Stable Diffusion, and video generation models. Generated images are automatically downloaded and saved to the workspace for viewing in chat history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "The text prompt for media generation"
                    },
                    "model_id": {
                        "type": "string",
                        "description": "The fal.ai model ID",
                        "enum": [
                            "fal-ai/flux/dev",
                            "fal-ai/flux/schnell", 
                            "fal-ai/stable-diffusion-v3-medium",
                            "fal-ai/photorealism",
                            "fal-ai/stable-video-diffusion",
                            "fal-ai/runway-gen3"
                        ]
                    },
                    "seed": {
                        "type": "integer",
                        "description": "Random seed for reproducible results"
                    },
                    "image_size": {
                        "type": "string", 
                        "description": "Image size/aspect ratio",
                        "enum": ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"]
                    },
                    "num_images": {
                        "type": "integer",
                        "description": "Number of images to generate (1-4)",
                        "minimum": 1,
                        "maximum": 4
                    },
                    "num_inference_steps": {
                        "type": "integer",
                        "description": "Number of inference steps (higher = better quality, slower)"
                    },
                    "guidance_scale": {
                        "type": "number",
                        "description": "Guidance scale (7.5 is typical, higher = more prompt adherence)"
                    }
                },
                "required": ["prompt", "model_id"]
            }
        }
    })
    async def fal_media_generation(
        self,
        prompt: str,
        model_id: str,
        seed: Optional[int] = None,
        image_size: Optional[str] = "landscape_4_3",
        num_images: Optional[int] = 1,
        num_inference_steps: Optional[int] = None,
        guidance_scale: Optional[float] = None
    ) -> ToolResult:
        """Generate media using fal.ai and save to workspace"""
        
        # Check if fal.ai API key is configured
        if not os.getenv("FAL_KEY"):
            return self.fail_response("FAL_KEY environment variable not set. Please configure your fal.ai API key.")

        try:
            # Use the selected media model from environment if available, otherwise use the provided model_id
            selected_model = os.getenv('SELECTED_MEDIA_MODEL')
            effective_model_id = selected_model if selected_model and selected_model.startswith('fal-ai/') else model_id
            
            if selected_model and selected_model != model_id:
                print(f"🎨 Using selected media model: {effective_model_id} (overriding {model_id})")
            
            # Create request object
            request = FalMediaRequest(
                prompt=prompt,
                model_id=effective_model_id,
                seed=seed,
                image_size=image_size,
                num_images=num_images,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale
            )
            
            # Prepare arguments for the specific model
            arguments = self._prepare_arguments(request)
            
            # Generate media using fal.ai
            result = await self._generate_media_async(request.model_id, arguments)
            
            # Parse the response based on media type
            response_data = {
                "success": True,
                "images": [],
                "videos": [],
                "saved_files": [],
                "request_id": result.get("request_id")
            }
            
            if self._is_video_model(request.model_id):
                # Handle video response
                if "video" in result:
                    if isinstance(result["video"], str):
                        response_data["videos"] = [result["video"]]
                    elif isinstance(result["video"], dict) and "url" in result["video"]:
                        response_data["videos"] = [result["video"]["url"]]
                elif "videos" in result:
                    response_data["videos"] = [video["url"] if isinstance(video, dict) else video for video in result["videos"]]
            else:
                # Handle image response and download/save images
                if "images" in result:
                    response_data["images"] = [img["url"] for img in result["images"]]
                    
                    # Download and save images
                    logger.info("Starting image download and save process...")
                    saved_files = []
                    download_errors = []
                    for i, image_url in enumerate(response_data["images"]):
                        try:
                            logger.info(f"Processing image {i+1} at URL: {image_url}")
                            saved_path = await self._download_and_save_image(image_url, prompt, request.model_id, seed)
                            saved_files.append(saved_path)
                        except Exception as e:
                            error_message = f"Failed to save image {i+1} from {image_url}: {str(e)}"
                            logger.error(error_message, exc_info=True)
                            download_errors.append(error_message)
                    
                    response_data["saved_files"] = saved_files
                    logger.info(f"Completed image download process. Saved {len(saved_files)} files.")

                    if download_errors:
                        # If some images failed to download, add error details to the response
                        error_summary = "\n".join(download_errors)
                        response_data['error'] = f"Could not save all generated images to the workspace. The following errors occurred:\n{error_summary}"

            # Create success message
            success_message_parts = []
            if response_data.get("images"):
                success_message_parts.append(f"Successfully generated {len(response_data['images'])} image(s).")
            
            if response_data["saved_files"]:
                files_list = "\n".join([f"- {path}" for path in response_data["saved_files"]])
                success_message_parts.append(f"Saved {len(response_data['saved_files'])} to your workspace:\n{files_list}")
                success_message_parts.append("The images are now available in your workspace files and will be displayed in the chat history.")

            if response_data.get("error"):
                 success_message_parts.append(f"\nHowever, some images could not be saved:\n{response_data['error']}")
                 if not response_data["saved_files"]:
                     success_message_parts.append(f"You can try to access them at these temporary URLs: {response_data.get('images', [])}")

            if response_data.get("videos"):
                success_message_parts.append(f"Successfully generated video. URL: {response_data.get('videos', [])}")

            if not success_message_parts:
                success_message = "Media generation completed, but no files were produced or saved."
            else:
                success_message = "\n\n".join(success_message_parts)


            # Include the success message in the response data
            response_data["message"] = success_message
            return self.success_response(response_data)

        except Exception as e:
            logger.error(f"Failed to generate media with {model_id}: {str(e)}", exc_info=True)
            return self.fail_response(f"Failed to generate media with {model_id}: {str(e)}")


# Export the tool class (not instance, since it needs project_id)
FalMediaToolClass = FalMediaTool 